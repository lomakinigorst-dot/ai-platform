from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models import Client

router = APIRouter(prefix="/settings", tags=["settings"])


class AssistantSettings(BaseModel):
    assistant_name: str | None = None
    assistant_gender: str | None = None
    assistant_avatar_url: str | None = None
    assistant_mode: str | None = None
    system_prompt: str | None = None


class WidgetSettings(BaseModel):
    widget_settings: dict | None = None


class IntegrationSettings(BaseModel):
    telegram_chat_id: str | None = None
    bitrix_webhook: str | None = None
    amocrm_token: str | None = None
    email_notifications: str | None = None


class NotificationSettings(BaseModel):
    email_notifications: str | None = None
    telegram_chat_id: str | None = None


@router.get("/clients/{client_id}/assistant")
async def get_assistant_settings(client_id: UUID, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")
    return {
        "assistant_name": client.assistant_name,
        "assistant_gender": client.assistant_gender,
        "assistant_avatar_url": client.assistant_avatar_url,
        "assistant_mode": client.assistant_mode,
        "system_prompt": client.system_prompt,
    }


@router.patch("/clients/{client_id}/assistant")
async def update_assistant_settings(
    client_id: UUID,
    body: AssistantSettings,
    db: AsyncSession = Depends(get_db),
):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    if body.assistant_name is not None:
        client.assistant_name = body.assistant_name
    if body.assistant_gender is not None:
        if body.assistant_gender not in ("male", "female"):
            raise HTTPException(400, "assistant_gender: male или female")
        client.assistant_gender = body.assistant_gender
    if body.assistant_avatar_url is not None:
        client.assistant_avatar_url = body.assistant_avatar_url
    if body.assistant_mode is not None:
        if body.assistant_mode not in ("sales", "support"):
            raise HTTPException(400, "assistant_mode: sales или support")
        client.assistant_mode = body.assistant_mode
    if body.system_prompt is not None:
        client.system_prompt = body.system_prompt

    await db.commit()
    return {"ok": True}


@router.get("/clients/{client_id}/widget")
async def get_widget_settings(client_id: UUID, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")
    return {
        "widget_settings": client.widget_settings or {},
        "embed_code": _build_embed_code(client),
    }


@router.patch("/clients/{client_id}/widget")
async def update_widget_settings(
    client_id: UUID,
    body: WidgetSettings,
    db: AsyncSession = Depends(get_db),
):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")
    if body.widget_settings is not None:
        client.widget_settings = body.widget_settings
    await db.commit()
    return {"ok": True, "embed_code": _build_embed_code(client)}


@router.get("/clients/{client_id}/integrations")
async def get_integrations(client_id: UUID, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")
    return {
        "telegram_chat_id": client.telegram_chat_id,
        "bitrix_webhook": client.bitrix_webhook,
        "amocrm_token": "***" if client.amocrm_token else None,
        "email_notifications": client.email_notifications,
    }


@router.patch("/clients/{client_id}/integrations")
async def update_integrations(
    client_id: UUID,
    body: IntegrationSettings,
    db: AsyncSession = Depends(get_db),
):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    if body.telegram_chat_id is not None:
        client.telegram_chat_id = body.telegram_chat_id
    if body.bitrix_webhook is not None:
        client.bitrix_webhook = body.bitrix_webhook
    if body.amocrm_token is not None:
        client.amocrm_token = body.amocrm_token
    if body.email_notifications is not None:
        client.email_notifications = body.email_notifications

    await db.commit()
    return {"ok": True}


def _build_embed_code(client: Client) -> str:
    avatar_line = f"      avatar: '{client.assistant_avatar_url}'," if client.assistant_avatar_url else ""
    return f"""<!-- AI Platform Widget -->
<script>
  window.AIPlatformConfig = {{
    apiBase: 'https://api.yourdomain.com',
    domain:  '{client.domain}',
    name:    '{client.assistant_name}',
{avatar_line}
    triggerDelay: 5000,
  }};
</script>
<script src="https://api.yourdomain.com/static/widget/widget.js" async></script>"""
