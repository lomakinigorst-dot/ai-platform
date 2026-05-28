import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.ai import stream_chat

router = APIRouter(prefix="/atlas", tags=["atlas"])

ATLAS_SYSTEM = """Ты AI Atlas — умный бизнес-ассистент и оркестратор AI-платформы.

Ты можешь помочь с любым деловым вопросом: маркетинг, продажи, HR, финансы, юридические вопросы, стратегия, анализ рынка, копирайтинг, переговоры, управление проектами — отвечай без ограничений.

Помимо общих задач, ты координируешь AI-блоки платформы:
- AI Консультант: виджет-чат на сайт, захват лидов, база знаний, RAG
- AI Маркетолог: ДНК-анализ аудитории, персонализированные рассылки, анализ конкурентов
- AI HR: воронка найма, вакансии, тесты кандидатов
- AI Финансы: P&L, ДДС, подключение банков
- AI Юрист: анализ договоров, проверка контрагентов
- AI Продажи: тренировки менеджеров, анализ звонков, скрипты

Принципы работы:
- Отвечай развёрнуто, структурированно, с конкретными советами
- Используй markdown: заголовки, списки, **выделение** важного
- На вопросы о бизнесе — давай экспертный ответ, не отсылай к «специалистам»
- Если задача подходит под один из AI-блоков — предложи его использовать
- Отвечай на русском. Не придумывай данные — если не знаешь точно, скажи честно"""


class AtlasMessage(BaseModel):
    role: str
    content: str


class AtlasRequest(BaseModel):
    messages: list[AtlasMessage]


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
