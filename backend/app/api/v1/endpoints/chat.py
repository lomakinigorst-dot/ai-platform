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
    """
    WOW-демо: берёт реальную главную страницу клиента, инжектирует виджет.
    Клиент открывает и видит свой собственный сайт с уже работающим AI.
    """
    import re as _re
    import httpx

    client = await db.scalar(select(Client).where(Client.domain == domain))
    if not client:
        raise HTTPException(404, "Клиент не найден")

    site_url = client.website_url.rstrip("/")
    base_url = f"https://{domain}"

    # Пытаемся получить реальную страницу клиента
    original_html: str | None = None
    try:
        async with httpx.AsyncClient(
            timeout=10,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; AI-Platform-Demo/1.0)"},
        ) as http:
            resp = await http.get(site_url)
            if resp.status_code == 200:
                original_html = resp.text
    except Exception:
        pass

    # Если не смогли получить сайт — используем fallback-шаблон
    if not original_html:
        original_html = _fallback_html(client)

    # Конвертируем относительные URL в абсолютные (чтобы картинки и стили грузились)
    for attr in ("src", "href", "action"):
        original_html = _re.sub(
            rf'({attr}=["\'])(/[^"\']*)',
            rf'\g<1>{base_url}\g<2>',
            original_html,
        )

    # Убираем CSP/X-Frame-Options из мета-тегов (мешают встраиванию)
    original_html = _re.sub(
        r'<meta[^>]+http-equiv=["\'](?:Content-Security-Policy|X-Frame-Options)["\'][^>]*>',
        '',
        original_html,
        flags=_re.IGNORECASE,
    )

    # Определяем base_url бэкенда
    from app.core.config import settings
    api_base = f"https://{settings.BASE_DOMAIN}" if settings.ENVIRONMENT == "production" else "http://localhost:8000"

    avatar = client.assistant_avatar_url or ""
    avatar_js = f"'{avatar}'" if avatar else "null"

    widget_snippet = f"""
<!-- AI Platform Demo Widget -->
<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#FEF3C7;border-bottom:2px solid #F59E0B;padding:10px 20px;text-align:center;font-family:system-ui;font-size:13px;color:#92400E">
  <strong>Демо AI-ассистента</strong> для {client.name} — нажмите кнопку справа внизу, чтобы поговорить с AI
</div>
<script>
  window.AIPlatformConfig = {{
    apiBase: '{api_base}',
    domain:  '{client.domain}',
    name:    '{client.assistant_name}',
    avatar:  {avatar_js},
    triggerDelay: 3000,
  }};
</script>
<script src="{api_base}/static/widget/widget.js" async></script>
"""

    # Вставляем виджет перед </body> (или в конец если тег не найден)
    if "</body>" in original_html.lower():
        original_html = _re.sub(r'</body>', widget_snippet + "</body>", original_html, flags=_re.IGNORECASE, count=1)
    else:
        original_html += widget_snippet

    return HTMLResponse(content=original_html)


def _fallback_html(client: "Client") -> str:
    """Резервный шаблон если не удалось загрузить сайт клиента."""
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{client.name} — Демо AI-ассистента</title>
  <style>
    body{{font-family:system-ui,sans-serif;background:#F8FAFC;color:#0F172A;min-height:100vh;display:flex;align-items:center;justify-content:center}}
    .card{{background:white;border:1px solid #E2E8F0;border-radius:20px;padding:48px;text-align:center;max-width:480px}}
    h1{{font-size:28px;font-weight:800;margin-bottom:12px}}
    p{{color:#64748B;line-height:1.6}}
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:48px;margin-bottom:20px">🤖</div>
    <h1>{client.name}</h1>
    <p>AI-ассистент готов к работе.<br>Нажмите кнопку справа внизу, чтобы начать диалог.</p>
  </div>
</body>
</html>"""


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
