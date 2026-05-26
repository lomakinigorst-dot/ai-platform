import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.ai import stream_chat

router = APIRouter(prefix="/atlas", tags=["atlas"])

ATLAS_SYSTEM = """Ты AI Atlas — умный оркестратор AI-платформы для бизнеса.
Ты координируешь следующие AI-блоки:
- AI Консультант: виджет-чат на сайт, захват лидов, база знаний, RAG
- AI Маркетолог: ДНК-анализ аудитории, персонализированные рассылки, анализ конкурентов
- AI HR: воронка найма, вакансии, тесты кандидатов (скоро)
- AI Финансы: P&L, ДДС, подключение банков (скоро)
- AI Юрист: анализ договоров, проверка контрагентов (скоро)
- AI Отдел продаж: тренировки менеджеров, анализ звонков (скоро)

Твои задачи:
1. Помогать настраивать и использовать AI-блоки
2. Рекомендовать нужный инструмент под конкретную задачу
3. Объяснять возможности платформы
4. Давать советы по росту бизнеса клиентов агентства

Отвечай на русском, кратко и по делу. Не придумывай данные — если не знаешь, скажи честно."""


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
