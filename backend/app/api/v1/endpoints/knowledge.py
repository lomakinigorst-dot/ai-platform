from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.database import get_db
from app.models import Client, KnowledgeItem
from app.services.embeddings import get_embedding

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


class KnowledgeItemOut(BaseModel):
    id: str
    source_url: str | None
    source_type: str
    folder: str | None
    title: str | None
    content: str
    content_edited: str | None
    chunk_index: int
    token_count: int


class KnowledgeItemUpdate(BaseModel):
    content_edited: str


class ManualKnowledgeCreate(BaseModel):
    title: str
    content: str
    folder: str | None = None


@router.get("/clients/{client_id}/items", response_model=list[KnowledgeItemOut])
async def list_knowledge(
    client_id: UUID,
    source_url: str | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    q = select(KnowledgeItem).where(KnowledgeItem.client_id == client_id)
    if source_url:
        q = q.where(KnowledgeItem.source_url == source_url)
    if search:
        q = q.where(KnowledgeItem.content.ilike(f"%{search}%"))
    q = q.order_by(KnowledgeItem.source_url, KnowledgeItem.chunk_index).limit(limit).offset(offset)

    result = await db.execute(q)
    items = result.scalars().all()
    return [KnowledgeItemOut(
        id=str(i.id),
        source_url=i.source_url,
        source_type=i.source_type,
        folder=i.folder,
        title=i.title,
        content=i.content,
        content_edited=i.content_edited,
        chunk_index=i.chunk_index,
        token_count=i.token_count,
    ) for i in items]


@router.get("/clients/{client_id}/sources")
async def list_sources(client_id: UUID, db: AsyncSession = Depends(get_db)):
    """Список уникальных источников (URL-ов) в базе знаний."""
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    result = await db.execute(
        select(KnowledgeItem.source_url, func.count(KnowledgeItem.id).label("chunks"))
        .where(KnowledgeItem.client_id == client_id)
        .group_by(KnowledgeItem.source_url)
        .order_by(KnowledgeItem.source_url)
    )
    rows = result.fetchall()
    return [{"source_url": r.source_url, "chunks": r.chunks} for r in rows]


@router.patch("/clients/{client_id}/items/{item_id}")
async def update_knowledge_item(
    client_id: UUID,
    item_id: UUID,
    body: KnowledgeItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Редактировать чанк базы знаний и пересчитать эмбеддинг."""
    item = await db.get(KnowledgeItem, item_id)
    if not item or item.client_id != client_id:
        raise HTTPException(404, "Элемент не найден")

    item.content_edited = body.content_edited
    item.embedding = await get_embedding(body.content_edited)
    await db.commit()
    return {"ok": True}


@router.delete("/clients/{client_id}/items/{item_id}")
async def delete_knowledge_item(
    client_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(KnowledgeItem, item_id)
    if not item or item.client_id != client_id:
        raise HTTPException(404, "Элемент не найден")
    await db.delete(item)
    await db.commit()
    return {"ok": True}


@router.post("/clients/{client_id}/items")
async def create_knowledge_item(
    client_id: UUID,
    body: ManualKnowledgeCreate,
    db: AsyncSession = Depends(get_db),
):
    """Добавить чанк вручную (FAQ, прайс, и т.д.)."""
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    embedding = await get_embedding(body.content)
    item = KnowledgeItem(
        client_id=client_id,
        source_type="manual",
        folder=body.folder or "Вручную",
        title=body.title,
        content=body.content,
        embedding=embedding,
        token_count=len(body.content.split()),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "ok": True}
