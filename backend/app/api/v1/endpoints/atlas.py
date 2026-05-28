import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import KnowledgeItem
from app.services.ai import extract_vision, stream_chat_thinking
from app.services.embeddings import get_embedding

router = APIRouter(prefix="/atlas", tags=["atlas"])

ATLAS_SYSTEM = """Ты AI Atlas — опытный бизнес-советник и финансовый аналитик.

Ты отвечаешь на ЛЮБЫЕ вопросы без ограничений:
- Анализируешь акции, компании, рынки, инвестиционные идеи
- Помогаешь с маркетингом, продажами, стратегией, HR, юридическими вопросами
- Пишешь тексты, коммерческие предложения, скрипты, договоры
- Анализируешь финансовые отчёты, делаешь прогнозы, считаешь метрики
- Консультируешь по бизнес-стратегии и управлению
- Анализируешь изображения, документы, схемы, фотографии

ВАЖНО: Никогда не говори «я не занимаюсь этим» или «обратитесь к специалисту». Отвечай как эксперт по любому деловому или финансовому вопросу.

Ты также координируешь AI-блоки платформы (предлагай только когда реально уместно):
- AI Консультант: виджет-чат на сайт, захват лидов, база знаний, RAG
- AI Маркетолог: ДНК-анализ аудитории, персонализированные рассылки
- AI HR: воронка найма, вакансии, тесты кандидатов
- AI Финансы: P&L, ДДС, подключение банков
- AI Юрист: анализ договоров, проверка контрагентов
- AI Продажи: тренировки менеджеров, анализ звонков, скрипты

Формат ответов:
- Используй markdown: ## заголовки, **жирный**, списки, таблицы
- Отвечай структурированно и по существу
- Отвечай на русском
- Если данных для точного ответа нет — говори об этом честно, но давай максимально полезный ответ на основе доступных знаний"""


class AtlasMessage(BaseModel):
    role: str
    content: str
    imageData: str | None = None  # data:image/...;base64,... для vision


class AtlasRequest(BaseModel):
    messages: list[AtlasMessage]


class AtlasKBCreate(BaseModel):
    title: str
    content: str


@router.post("/chat")
async def atlas_chat(body: AtlasRequest):
    # Последнее сообщение пользователя с вложением
    last_user = next(
        (m for m in reversed(body.messages) if m.role == "user"),
        None,
    )
    has_attachment = last_user is not None and last_user.imageData is not None

    async def generate():
        vision_description: str | None = None

        # ── Шаг 1: Vision extraction (если есть файл) ───────────────────────
        if has_attachment and last_user and last_user.imageData:
            try:
                yield f"data: {json.dumps({'vision_start': True}, ensure_ascii=False)}\n\n"
                description = await extract_vision(
                    last_user.imageData,
                    last_user.content or "",
                )
                vision_description = description
                # Стримим описание чанками (имитация потока)
                words = description.split()
                chunk_size = 6
                for i in range(0, len(words), chunk_size):
                    chunk = " ".join(words[i:i + chunk_size]) + (" " if i + chunk_size < len(words) else "")
                    yield f"data: {json.dumps({'vision': chunk}, ensure_ascii=False)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'vision': f'Не удалось проанализировать файл: {e}'}, ensure_ascii=False)}\n\n"

        # ── Шаг 2: DeepSeek V4 Flash с thinking mode ────────────────────────
        messages: list[dict] = [{"role": "system", "content": ATLAS_SYSTEM}]

        for m in body.messages[-20:]:
            if m.role == "user" and m.imageData and vision_description:
                # Для последнего сообщения с вложением — добавляем описание
                combined = f"[Вложение проанализировано]\n{vision_description}\n\n{m.content or ''}".strip()
                messages.append({"role": "user", "content": combined})
            else:
                messages.append({"role": m.role, "content": m.content})

        try:
            async for event_type, chunk in stream_chat_thinking(messages):
                yield f"data: {json.dumps({event_type: chunk}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/knowledge")
async def atlas_save_knowledge(body: AtlasKBCreate, db: AsyncSession = Depends(get_db)):
    """Сохранить ответ Atlas в глобальную базу знаний."""
    embedding = await get_embedding(body.content)
    item = KnowledgeItem(
        client_id=None,
        is_global=True,
        source_type="atlas",
        folder="Atlas KB",
        title=body.title,
        content=body.content,
        embedding=embedding,
        token_count=len(body.content.split()),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "ok": True}
