"""
Клиентский портал — доступ по токену.
Токен хранится в widget_settings['portal_token'].
"""
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from app.core.database import get_db
from app.models import Client, Conversation, Message, Lead, KnowledgeItem

router = APIRouter(prefix="/portal", tags=["portal"])


async def _find_client_by_token(token: str, db: AsyncSession) -> Client:
    result = await db.execute(select(Client))
    for client in result.scalars().all():
        ws = client.widget_settings or {}
        if ws.get("portal_token") == token:
            return client
    raise HTTPException(404, "Портал не найден или ссылка устарела")


@router.post("/generate/{client_id}")
async def generate_portal_token(client_id: str, db: AsyncSession = Depends(get_db)):
    """Агентство генерирует токен доступа для клиента."""
    try:
        cid = uuid.UUID(client_id)
    except ValueError:
        raise HTTPException(400, "Неверный ID клиента")

    client = await db.get(Client, cid)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    token = str(uuid.uuid4()).replace("-", "")
    ws = dict(client.widget_settings or {})
    ws["portal_token"] = token
    client.widget_settings = ws
    await db.commit()

    return {"portal_token": token}


@router.get("/{token}")
async def get_portal_data(token: str, db: AsyncSession = Depends(get_db)):
    """Клиент открывает портал — получает свои данные без логина."""
    client = await _find_client_by_token(token, db)
    client_id = client.id

    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    # Статистика
    conv_today = await db.scalar(select(func.count(Conversation.id)).where(and_(Conversation.client_id == client_id, Conversation.created_at >= today))) or 0
    conv_week  = await db.scalar(select(func.count(Conversation.id)).where(and_(Conversation.client_id == client_id, Conversation.created_at >= week_ago))) or 0
    conv_total = await db.scalar(select(func.count(Conversation.id)).where(Conversation.client_id == client_id)) or 0
    leads_total = await db.scalar(select(func.count(Lead.id)).where(Lead.client_id == client_id)) or 0
    leads_new   = await db.scalar(select(func.count(Lead.id)).where(and_(Lead.client_id == client_id, Lead.status == "new"))) or 0

    # Последние лиды
    leads_rows = await db.execute(select(Lead).where(Lead.client_id == client_id).order_by(desc(Lead.created_at)).limit(10))
    leads = leads_rows.scalars().all()

    # Последние диалоги
    conv_rows = await db.execute(select(Conversation).where(Conversation.client_id == client_id).order_by(desc(Conversation.created_at)).limit(10))
    conversations = conv_rows.scalars().all()

    return {
        "client": {
            "id": str(client.id),
            "name": client.name,
            "domain": client.domain,
            "assistant_name": client.assistant_name,
            "assistant_mode": client.assistant_mode,
            "assistant_avatar_url": client.assistant_avatar_url,
            "status": client.status,
            "marketing_status": client.marketing_status,
        },
        "stats": {
            "conversations_today": conv_today,
            "conversations_week": conv_week,
            "conversations_total": conv_total,
            "leads_total": leads_total,
            "leads_new": leads_new,
        },
        "leads": [
            {
                "id": str(l.id),
                "created_at": l.created_at.isoformat(),
                "name": l.name,
                "phone": l.phone,
                "email": l.email,
                "request_text": l.request_text,
                "status": l.status,
            }
            for l in leads
        ],
        "conversations": [
            {
                "id": str(c.id),
                "created_at": c.created_at.isoformat(),
                "visitor_id": str(c.visitor_id),
                "is_lead": c.is_lead,
                "message_count": c.message_count,
            }
            for c in conversations
        ],
        "dna": client.marketing_data,
    }
