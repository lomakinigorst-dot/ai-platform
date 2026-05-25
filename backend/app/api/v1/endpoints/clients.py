import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models import Client, ClientStatus, KnowledgeItem
from app.api.v1.schemas.client import ClientCreate, ClientResponse, ClientList
from app.services.crawler import extract_domain, normalize_url, crawl_website, extract_contacts, detect_niche
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
    await db.commit()

    background_tasks.add_task(index_website, client.id, client.website_url)
    return client


async def index_website(client_id: UUID, url: str):
    """Фоновая задача: сканирует сайт и строит базу знаний."""
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        client = await db.get(Client, client_id)
        if not client:
            return

        try:
            # 1. Сканируем сайт
            result = await crawl_website(url, limit=50)
            pages = result["pages"]

            client.pages_total = len(pages)
            await db.commit()

            # 2. Определяем нишу и контакты
            client.niche = detect_niche(pages)
            client.company_contacts = extract_contacts(pages)

            # 3. Удаляем старую базу знаний
            old_items = await db.execute(
                select(KnowledgeItem).where(KnowledgeItem.client_id == client_id)
            )
            for item in old_items.scalars():
                await db.delete(item)
            await db.commit()

            # 4. Чункуем и создаём эмбеддинги
            all_chunks = []
            sources = []
            for page in pages:
                text = page.get("content", "")
                if not text.strip():
                    continue
                for i, ch in enumerate(chunk(text)):
                    all_chunks.append(ch)
                    sources.append((page.get("url"), page.get("title"), i))

            # Батчами по 20 чтобы не перегрузить API
            batch_size = 20
            indexed = 0
            for i in range(0, len(all_chunks), batch_size):
                batch = all_chunks[i: i + batch_size]
                batch_sources = sources[i: i + batch_size]

                embeddings = await get_embeddings_batch(batch)

                for ch, src, emb in zip(batch, batch_sources, embeddings):
                    item = KnowledgeItem(
                        client_id=client_id,
                        source_url=src[0],
                        title=src[1],
                        content=ch,
                        embedding=emb,
                        chunk_index=src[2],
                        token_count=len(ch.split()),
                        source_type="webpage",
                    )
                    db.add(item)

                indexed += len(batch)
                client.pages_indexed = min(indexed // max(len(all_chunks) // len(pages), 1), len(pages))
                client.index_progress = round(indexed / max(len(all_chunks), 1) * 100, 1)
                await db.commit()

            # 5. Готово
            client.status = ClientStatus.active
            client.index_progress = 100.0
            client.pages_indexed = len(pages)
            await db.commit()

        except Exception as e:
            client.status = ClientStatus.pending
            client.index_progress = 0
            await db.commit()
            raise
