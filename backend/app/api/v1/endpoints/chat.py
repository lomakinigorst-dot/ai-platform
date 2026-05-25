import re
import json
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db, AsyncSessionLocal
from app.models import Client, ClientStatus, Conversation, Message, Lead
from app.services.rag import search_knowledge, build_system_prompt
from app.services.ai import stream_completion
from app.services.email import send_email, lead_notification_html

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    client_domain: str
    visitor_id: str
    messages: list[ChatMessage]
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    referrer: str | None = None


@router.post("/stream")
async def chat_stream(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    # 1. Валидация клиента
    client = await db.scalar(select(Client).where(Client.domain == body.client_domain))
    if not client:
        raise HTTPException(404, "Клиент не найден")
    if client.status != ClientStatus.active:
        raise HTTPException(400, "База знаний ещё не готова")

    client_id = client.id

    # 2. Создаём/находим сессию диалога
    conversation = await db.scalar(
        select(Conversation).where(
            Conversation.client_id == client_id,
            Conversation.visitor_id == body.visitor_id,
            Conversation.ended_at.is_(None),
        )
    )
    if not conversation:
        conversation = Conversation(
            client_id=client_id,
            visitor_id=body.visitor_id,
            utm_source=body.utm_source,
            utm_medium=body.utm_medium,
            utm_campaign=body.utm_campaign,
            referrer=body.referrer,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    conversation_id = conversation.id
    user_message = body.messages[-1].content if body.messages else ""

    # 3. RAG: получаем релевантный контекст
    context_chunks = await search_knowledge(db, client_id, user_message)

    # 4. Строим промпт и историю
    system_prompt = build_system_prompt(client, context_chunks)
    messages_for_model = [{"role": "system", "content": system_prompt}]
    for msg in body.messages[-10:]:
        messages_for_model.append({"role": msg.role, "content": msg.content})

    # 5. Сохраняем сообщение пользователя
    user_msg = Message(conversation_id=conversation_id, role="user", content=user_message)
    db.add(user_msg)
    await db.commit()

    # Снэпшот данных для генератора (без ссылки на db сессию)
    all_user_messages = [m.model_dump() for m in body.messages]
    assistant_mode = client.assistant_mode

    async def generate():
        full_response = ""

        try:
            async for chunk in stream_completion(messages_for_model):
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        # Сохраняем ответ AI в новой сессии
        async with AsyncSessionLocal() as save_db:
            ai_msg = Message(conversation_id=conversation_id, role="assistant", content=full_response)
            save_db.add(ai_msg)

            # Извлекаем лид если режим продажника
            if assistant_mode == "sales":
                all_text = " ".join(m["content"] for m in all_user_messages if m["role"] == "user")
                phones = re.findall(r"[\+7|8]?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}", all_text)
                emails = re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", all_text)

                if phones or emails:
                    existing_lead = await save_db.scalar(
                        select(Lead).where(Lead.conversation_id == conversation_id)
                    )
                    if not existing_lead:
                        lead = Lead(
                            client_id=client_id,
                            conversation_id=conversation_id,
                            phone=phones[0] if phones else None,
                            email=emails[0] if emails else None,
                            request_text=user_message,
                        )
                        save_db.add(lead)
                        conv = await save_db.get(Conversation, conversation_id)
                        if conv:
                            conv.is_lead = True

                        await save_db.commit()

                        # Email-уведомление клиенту
                        notify_client = await save_db.get(Client, client_id)
                        if notify_client:
                            notify_email = _get_client_email(notify_client)
                            if notify_email:
                                subject, html = lead_notification_html(
                                    company_name=notify_client.name,
                                    assistant_name=notify_client.assistant_name,
                                    phone=phones[0] if phones else None,
                                    email=emails[0] if emails else None,
                                    request_text=user_message,
                                    conversation_id=str(conversation_id),
                                )
                                await send_email(notify_email, subject, html)
                        return

            await save_db.commit()

        yield f"data: {json.dumps({'done': True, 'conversation_id': str(conversation_id)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/demo/{domain}", response_class=HTMLResponse)
async def demo_page(domain: str, db: AsyncSession = Depends(get_db)):
    client = await db.scalar(select(Client).where(Client.domain == domain))
    if not client:
        raise HTTPException(404, "Клиент не найден")

    demo_html_path = Path(__file__).parent.parent.parent.parent.parent.parent / "widget" / "demo.html"
    if not demo_html_path.exists():
        raise HTTPException(500, "demo.html не найден")

    html = demo_html_path.read_text(encoding="utf-8")

    api_base = "http://localhost:8000"
    avatar = client.assistant_avatar_url or "null"
    avatar_js = f"'{avatar}'" if avatar != "null" else "null"

    html = html.replace("'WIDGET_API_BASE'", f"'{api_base}'")
    html = html.replace("'WIDGET_DOMAIN'", f"'{client.domain}'")
    html = html.replace("'WIDGET_NAME'", f"'{client.assistant_name}'")
    html = html.replace("'WIDGET_AVATAR'", avatar_js)
    html = html.replace("src=\"widget.js\"", "src=\"/static/widget/widget.js\"")

    return HTMLResponse(content=html)


def _get_client_email(client: Client) -> str | None:
    """Получить email для уведомлений: email_notifications > первый из company_contacts."""
    if client.email_notifications:
        return client.email_notifications
    contacts = client.company_contacts
    if isinstance(contacts, dict):
        emails = contacts.get("emails", [])
        if emails:
            return emails[0]
    return None
