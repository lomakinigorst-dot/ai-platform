from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from pydantic import BaseModel

from app.core.database import get_db
from app.models import Client, ClientStatus, Conversation, Message, Lead, KnowledgeItem

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    total_clients: int
    active_clients: int
    total_conversations_today: int
    total_conversations_week: int
    total_leads_today: int
    total_leads_week: int
    total_messages_today: int


class ClientStats(BaseModel):
    client_id: str
    conversations_today: int
    conversations_week: int
    conversations_total: int
    leads_total: int
    leads_new: int
    messages_total: int
    knowledge_chunks: int
    avg_messages_per_dialog: float


class LeadOut(BaseModel):
    id: str
    created_at: datetime
    name: str | None
    phone: str | None
    email: str | None
    request_text: str | None
    status: str
    priority: str
    utm_source: str | None
    utm_medium: str | None
    utm_campaign: str | None

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    created_at: datetime
    visitor_id: str
    is_lead: bool
    utm_source: str | None
    message_count: int | None = None

    class Config:
        from_attributes = True


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    total_clients = await db.scalar(select(func.count(Client.id)))
    active_clients = await db.scalar(
        select(func.count(Client.id)).where(Client.status == ClientStatus.active)
    )
    total_conversations_today = await db.scalar(
        select(func.count(Conversation.id)).where(Conversation.created_at >= today)
    )
    total_conversations_week = await db.scalar(
        select(func.count(Conversation.id)).where(Conversation.created_at >= week_ago)
    )
    total_leads_today = await db.scalar(
        select(func.count(Lead.id)).where(Lead.created_at >= today)
    )
    total_leads_week = await db.scalar(
        select(func.count(Lead.id)).where(Lead.created_at >= week_ago)
    )
    total_messages_today = await db.scalar(
        select(func.count(Message.id)).where(Message.created_at >= today)
    )

    return DashboardStats(
        total_clients=total_clients or 0,
        active_clients=active_clients or 0,
        total_conversations_today=total_conversations_today or 0,
        total_conversations_week=total_conversations_week or 0,
        total_leads_today=total_leads_today or 0,
        total_leads_week=total_leads_week or 0,
        total_messages_today=total_messages_today or 0,
    )


@router.get("/clients/{client_id}/stats", response_model=ClientStats)
async def get_client_stats(client_id: UUID, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    conversations_today = await db.scalar(
        select(func.count(Conversation.id)).where(
            and_(Conversation.client_id == client_id, Conversation.created_at >= today)
        )
    )
    conversations_week = await db.scalar(
        select(func.count(Conversation.id)).where(
            and_(Conversation.client_id == client_id, Conversation.created_at >= week_ago)
        )
    )
    conversations_total = await db.scalar(
        select(func.count(Conversation.id)).where(Conversation.client_id == client_id)
    )
    leads_total = await db.scalar(
        select(func.count(Lead.id)).where(Lead.client_id == client_id)
    )
    leads_new = await db.scalar(
        select(func.count(Lead.id)).where(
            and_(Lead.client_id == client_id, Lead.status == "new")
        )
    )
    messages_total = await db.scalar(
        select(func.count(Message.id)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(Conversation.client_id == client_id)
    )
    knowledge_chunks = await db.scalar(
        select(func.count(KnowledgeItem.id)).where(KnowledgeItem.client_id == client_id)
    )

    conv_total = conversations_total or 0
    msg_total = messages_total or 0
    avg = round(msg_total / conv_total, 1) if conv_total > 0 else 0.0

    return ClientStats(
        client_id=str(client_id),
        conversations_today=conversations_today or 0,
        conversations_week=conversations_week or 0,
        conversations_total=conv_total,
        leads_total=leads_total or 0,
        leads_new=leads_new or 0,
        messages_total=msg_total,
        knowledge_chunks=knowledge_chunks or 0,
        avg_messages_per_dialog=avg,
    )


@router.get("/clients/{client_id}/leads", response_model=list[LeadOut])
async def get_client_leads(
    client_id: UUID,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    q = select(Lead).where(Lead.client_id == client_id)
    if status:
        q = q.where(Lead.status == status)
    q = q.order_by(Lead.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(q)
    leads = result.scalars().all()
    return [LeadOut(
        id=str(l.id),
        created_at=l.created_at,
        name=l.name,
        phone=l.phone,
        email=l.email,
        request_text=l.request_text,
        status=l.status,
        priority=l.priority,
        utm_source=l.utm_source,
        utm_medium=l.utm_medium,
        utm_campaign=l.utm_campaign,
    ) for l in leads]


@router.patch("/clients/{client_id}/leads/{lead_id}/status")
async def update_lead_status(
    client_id: UUID,
    lead_id: UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    lead = await db.get(Lead, lead_id)
    if not lead or lead.client_id != client_id:
        raise HTTPException(404, "Лид не найден")
    new_status = body.get("status")
    if new_status not in ("new", "contacted", "closed"):
        raise HTTPException(400, "Неверный статус")
    lead.status = new_status
    await db.commit()
    return {"ok": True}


@router.get("/clients/{client_id}/conversations", response_model=list[ConversationOut])
async def get_client_conversations(
    client_id: UUID,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    result = await db.execute(
        select(Conversation)
        .where(Conversation.client_id == client_id)
        .order_by(Conversation.created_at.desc())
        .limit(limit).offset(offset)
    )
    conversations = result.scalars().all()

    out = []
    for c in conversations:
        msg_count = await db.scalar(
            select(func.count(Message.id)).where(Message.conversation_id == c.id)
        )
        out.append(ConversationOut(
            id=str(c.id),
            created_at=c.created_at,
            visitor_id=c.visitor_id,
            is_lead=c.is_lead,
            utm_source=c.utm_source,
            message_count=msg_count or 0,
        ))
    return out


@router.get("/leads", response_model=list[dict])
async def get_all_leads(
    status: str | None = None,
    client_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Все лиды по всем клиентам агентства."""
    q = select(Lead, Client.name.label("client_name"), Client.domain.label("client_domain")).join(
        Client, Lead.client_id == Client.id
    )
    if status:
        q = q.where(Lead.status == status)
    if client_id:
        q = q.where(Lead.client_id == client_id)
    q = q.order_by(desc(Lead.created_at)).limit(limit).offset(offset)

    result = await db.execute(q)
    rows = result.all()
    return [
        {
            "id": str(r.Lead.id),
            "created_at": r.Lead.created_at,
            "name": r.Lead.name,
            "phone": r.Lead.phone,
            "email": r.Lead.email,
            "request_text": r.Lead.request_text,
            "status": r.Lead.status,
            "priority": r.Lead.priority,
            "utm_source": r.Lead.utm_source,
            "utm_medium": r.Lead.utm_medium,
            "utm_campaign": r.Lead.utm_campaign,
            "client_id": str(r.Lead.client_id),
            "client_name": r.client_name,
            "client_domain": r.client_domain,
        }
        for r in rows
    ]


@router.get("/conversations", response_model=list[dict])
async def get_all_conversations(
    client_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Все диалоги по всем клиентам агентства."""
    q = select(
        Conversation,
        Client.name.label("client_name"),
        Client.domain.label("client_domain"),
    ).join(Client, Conversation.client_id == Client.id)
    if client_id:
        q = q.where(Conversation.client_id == client_id)
    q = q.order_by(desc(Conversation.created_at)).limit(limit).offset(offset)

    result = await db.execute(q)
    rows = result.all()

    out = []
    for r in rows:
        msg_count = await db.scalar(
            select(func.count(Message.id)).where(Message.conversation_id == r.Conversation.id)
        )
        out.append({
            "id": str(r.Conversation.id),
            "created_at": r.Conversation.created_at,
            "visitor_id": r.Conversation.visitor_id,
            "is_lead": r.Conversation.is_lead,
            "utm_source": r.Conversation.utm_source,
            "message_count": msg_count or 0,
            "client_id": str(r.Conversation.client_id),
            "client_name": r.client_name,
            "client_domain": r.client_domain,
        })
    return out


@router.get("/analytics", response_model=dict)
async def get_analytics(db: AsyncSession = Depends(get_db)):
    """Агрегированная аналитика агентства по всем клиентам."""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    # Топ клиентов по лидам
    top_by_leads = await db.execute(
        select(Client.id, Client.name, Client.domain, func.count(Lead.id).label("leads_count"))
        .outerjoin(Lead, Lead.client_id == Client.id)
        .group_by(Client.id, Client.name, Client.domain)
        .order_by(desc("leads_count"))
        .limit(10)
    )

    # Топ клиентов по диалогам
    top_by_convs = await db.execute(
        select(Client.id, Client.name, Client.domain, func.count(Conversation.id).label("conv_count"))
        .outerjoin(Conversation, Conversation.client_id == Client.id)
        .group_by(Client.id, Client.name, Client.domain)
        .order_by(desc("conv_count"))
        .limit(10)
    )

    # Динамика за 7 дней (по дням)
    from sqlalchemy import cast, Date as SADate
    daily = await db.execute(
        select(
            cast(Lead.created_at, SADate).label("day"),
            func.count(Lead.id).label("leads"),
        )
        .where(Lead.created_at >= week_ago)
        .group_by("day")
        .order_by("day")
    )
    daily_convs = await db.execute(
        select(
            cast(Conversation.created_at, SADate).label("day"),
            func.count(Conversation.id).label("convs"),
        )
        .where(Conversation.created_at >= week_ago)
        .group_by("day")
        .order_by("day")
    )

    leads_rows = top_by_leads.all()
    convs_rows = top_by_convs.all()
    daily_leads = {str(r.day): r.leads for r in daily.all()}
    daily_c = {str(r.day): r.convs for r in daily_convs.all()}

    # Общие итоги
    total_leads = await db.scalar(select(func.count(Lead.id))) or 0
    total_convs = await db.scalar(select(func.count(Conversation.id))) or 0
    total_clients = await db.scalar(select(func.count(Client.id))) or 0
    active_clients = await db.scalar(
        select(func.count(Client.id)).where(Client.status == ClientStatus.active)
    ) or 0

    return {
        "totals": {
            "leads": total_leads,
            "conversations": total_convs,
            "clients": total_clients,
            "active_clients": active_clients,
        },
        "top_by_leads": [
            {"id": str(r.id), "name": r.name, "domain": r.domain, "count": r.leads_count}
            for r in leads_rows
        ],
        "top_by_conversations": [
            {"id": str(r.id), "name": r.name, "domain": r.domain, "count": r.conv_count}
            for r in convs_rows
        ],
        "daily_leads": daily_leads,
        "daily_conversations": daily_c,
    }


@router.get("/clients/{client_id}/conversations/{conv_id}/messages")
async def get_conversation_messages(
    client_id: UUID,
    conv_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conv_id)
    if not conv or conv.client_id != client_id:
        raise HTTPException(404, "Диалог не найден")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return [{"id": str(m.id), "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]
