import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import KnowledgeItem
from app.services.ai import stream_chat
from app.services.embeddings import get_embedding

router = APIRouter(prefix="/atlas", tags=["atlas"])

ATLAS_SYSTEM = """Ты AI Atlas — опытный бизнес-советник и финансовый аналитик.

Ты отвечаешь на ЛЮБЫЕ вопросы без ограничений:
- Анализируешь акции, компании, рынки, инвестиционные идеи
- Помогаешь с маркетингом, продажами, стратегией, HR, юридическими вопросами
- Пишешь тексты, коммерческие предложения, скрипты, договоры
- Анализируешь финансовые отчёты, делаешь прогнозы, считаешь метрики
- Консультируешь по бизнес-стратегии и управлению

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


class AtlasRequest(BaseModel):
    messages: list[AtlasMessage]


class AtlasKBCreate(BaseModel):
    title: str
    content: str


@router.post("/chat")
async def atlas_chat(body: AtlasRequest):
    messages = [{"role": "system", "content": ATLAS_SYSTEM}]
    for m in body.messages[-20:]:
        messages.append({"role": m.role, "content": m.content})

    async def generate():
        try:
            async for chunk in stream_chat(messages):
                yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
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
    """Сохранить ответ Atlas в глобальную базу знаний (доступно всем агентам через RAG)."""
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
