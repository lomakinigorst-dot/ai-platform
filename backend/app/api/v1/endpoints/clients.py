import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models import Client, ClientStatus, KnowledgeItem
from app.api.v1.schemas.client import ClientCreate, ClientResponse, ClientList
from app.services.crawler import (
    extract_domain, normalize_url, smart_crawl,
    extract_contacts, detect_niche, _microdata_to_text,
    SiteUnavailableError, CrawlError,
)
from app.services.embeddings import get_embeddings_batch, chunk_text as chunk

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=ClientList)
async def list_clients(
    db: AsyncSession = Depends(get_db),
    status: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    q = select(Client)
    if status:
        q = q.where(Client.status == status)
    if search:
        q = q.where(Client.name.ilike(f"%{search}%") | Client.domain.ilike(f"%{search}%"))

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    result = await db.execute(q.offset(offset).limit(limit))
    clients = result.scalars().all()

    return ClientList(items=clients, total=total)


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    body: ClientCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    url = normalize_url(body.website_url)
    domain = extract_domain(url)

    # Проверяем что такой домен не добавлен
    existing = await db.scalar(select(Client).where(Client.domain == domain))
    if existing:
        raise HTTPException(400, f"Клиент с доменом {domain} уже существует")

    client = Client(
        name=domain,
        domain=domain,
        website_url=url,
        status=ClientStatus.indexing,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)

    # Запускаем сканирование в фоне
    background_tasks.add_task(index_website, client.id, url)

    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: UUID, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")
    return client


@router.delete("/{client_id}", status_code=204)
async def delete_client(client_id: UUID, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")
    await db.delete(client)
    await db.commit()


@router.post("/{client_id}/reindex", response_model=ClientResponse)
async def reindex_client(
    client_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    client.status = ClientStatus.indexing
    client.index_progress = 0
    client.pages_indexed = 0
    client.scan_phase = "Запуск..."
    client.needs_deep_scan = False
    await db.commit()

    background_tasks.add_task(index_website, client.id, client.website_url)


@router.post("/{client_id}/deep-scan", response_model=ClientResponse)
async def deep_scan_client(
    client_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Запустить глубокое сканирование (когда качество первичного скана низкое)."""
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    client.status = ClientStatus.indexing
    client.index_progress = 0
    client.pages_indexed = 0
    client.scan_phase = "Глубокое сканирование..."
    client.needs_deep_scan = False
    await db.commit()

    background_tasks.add_task(index_website, client.id, client.website_url, deep=True)
    return client


async def index_website(client_id: UUID, url: str, deep: bool = False):
    """Фоновая задача: умное фазовое сканирование сайта → база знаний."""
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        client = await db.get(Client, client_id)
        if not client:
            return

        try:
            # Прогресс-коллбек — сохраняет текущую фазу в scan_phase
            async def on_progress(phase: str, pct: int):
                client.index_progress = float(pct)
                client.scan_phase = phase
                await db.commit()

            # 1. Умное сканирование
            from app.services.crawler import deep_crawl
            crawl_fn = deep_crawl if deep else smart_crawl
            result = await crawl_fn(url, progress=on_progress)
            pages = result.pages

            client.pages_total = result.total_urls_found
            client.scan_quality = result.quality_score
            client.needs_deep_scan = result.needs_deep_scan
            await db.commit()

            # 2. Нишa и контакты
            client.niche = detect_niche(pages)
            client.company_contacts = extract_contacts(pages)

            # 3. Удаляем старую базу знаний
            old = await db.execute(select(KnowledgeItem).where(KnowledgeItem.client_id == client_id))
            for item in old.scalars():
                await db.delete(item)
            await db.commit()

            # 4. Собираем чанки: текст страницы + микроразметка
            all_chunks: list[str] = []
            meta: list[tuple[str, str, str, int]] = []  # url, title, folder, chunk_i

            for page in pages:
                # a) Основной текст страницы
                text = page.content.strip()
                if text:
                    for i, ch in enumerate(chunk(text)):
                        all_chunks.append(ch)
                        meta.append((page.url, page.title, page.folder, i))

                # b) Микроразметка как отдельный чанк в ту же папку
                micro_text = _microdata_to_text(page.microdata).strip()
                if micro_text:
                    folder_micro = f"{page.folder} / Микроразметка"
                    all_chunks.append(micro_text)
                    meta.append((page.url, f"[Микроразметка] {page.title}", folder_micro, 0))

            # 5. Эмбеддинги батчами по 20
            batch_size = 20
            indexed = 0
            total = max(len(all_chunks), 1)

            for i in range(0, len(all_chunks), batch_size):
                batch = all_chunks[i: i + batch_size]
                batch_meta = meta[i: i + batch_size]
                embeddings = await get_embeddings_batch(batch)

                for ch, m, emb in zip(batch, batch_meta, embeddings):
                    db.add(KnowledgeItem(
                        client_id=client_id,
                        source_url=m[0],
                        title=m[1],
                        folder=m[2],
                        content=ch,
                        embedding=emb,
                        chunk_index=m[3],
                        token_count=len(ch.split()),
                        source_type="webpage",
                    ))

                indexed += len(batch)
                client.index_progress = round(indexed / total * 100, 1)
                client.pages_indexed = indexed
                await db.commit()

            # 6. Готово
            client.status = ClientStatus.active
            client.index_progress = 100.0
            client.pages_indexed = len(pages)
            client.scan_phase = "done"
            await db.commit()

        except SiteUnavailableError as e:
            client.status = ClientStatus.pending
            client.index_progress = 0.0
            client.scan_phase = f"error: {e}"
            await db.commit()
            return  # не запускаем ДНК-анализ

        except Exception as e:
            client.status = ClientStatus.pending
            client.index_progress = 0.0
            client.scan_phase = "error"
            await db.commit()
            raise

    # 7. Авто-ДНК-анализ
    from app.services.marketing_dna import run_dna_analysis
    await run_dna_analysis(client_id)
