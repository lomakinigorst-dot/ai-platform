import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db, AsyncSessionLocal
from app.models import Client, KnowledgeItem
from app.services.ai import stream_completion

router = APIRouter(prefix="/marketing", tags=["marketing"])


class MarketingRequest(BaseModel):
    competitor_urls: list[str] = []
    extra_context: str = ""


MARKETING_SECTIONS = {
    "target_audience": {
        "title": "Целевая аудитория (ЦА)",
        "prompt": """Проанализируй базу знаний компании и определи целевую аудиторию.

Опиши:
1. **Основные сегменты ЦА** (3-5 портретов покупателя): возраст, пол, должность/статус, боли, желания
2. **Что их триггерит** — какие проблемы они решают с помощью этого продукта/услуги
3. **Как они принимают решение** — что важно при выборе, что останавливает
4. **Каналы привлечения** — где искать эту аудиторию

Отвечай структурированно с подзаголовками. Будь конкретным, опирайся на данные из базы знаний."""
    },
    "value_proposition": {
        "title": "УТП и позиционирование",
        "prompt": """Проанализируй базу знаний и сформулируй уникальное торговое предложение (УТП).

Опиши:
1. **Ключевые преимущества** компании — что выделяет их среди конкурентов
2. **Основное УТП** — одна фраза, которую можно вынести на главный экран
3. **Доказательства** — факты, цифры, гарантии из базы знаний
4. **Слабые места** — что отсутствует или неясно в позиционировании

Будь честным и конкретным."""
    },
    "content_strategy": {
        "title": "Контент-стратегия",
        "prompt": """На основе базы знаний компании и её ЦА разработай контент-стратегию.

Предложи:
1. **Темы для статей/постов** (10 конкретных тем), которые закрывают боли ЦА
2. **Форматы контента** — что зайдёт лучше всего для этой ниши
3. **Ключевые слова и запросы** — SEO-кластеры для продвижения
4. **Контент-план на 1 месяц** — примерный недельный ритм публикаций

Отвечай с конкретными примерами заголовков и тем."""
    },
    "sales_scripts": {
        "title": "Скрипты продаж",
        "prompt": """Создай скрипты продаж для AI-ассистента на основе базы знаний компании.

Разработай:
1. **Скрипт приветствия** — как начать разговор и выявить потребность (3-5 вопросов)
2. **Обработка топ-5 возражений** — конкретные ответы на частые «дорого», «подумаю», «уже есть поставщик»
3. **Скрипт закрытия** — как мягко предложить оставить контакт
4. **Стоп-фразы** — что нельзя говорить

Формат: диалог вопрос-ответ, реальные фразы."""
    },
    "competitor_analysis": {
        "title": "Анализ конкурентов",
        "prompt": """Проанализируй компанию и сформулируй стратегию конкурентного позиционирования.

На основе базы знаний определи:
1. **Прямые конкуренты** — кто работает в той же нише (если есть упоминания)
2. **Конкурентные преимущества** нашей компании — что есть у нас и нет у других
3. **Конкурентные слабости** — где мы, вероятно, проигрываем
4. **Стратегия дифференциации** — как отстроиться от конкурентов
5. **Ценовое позиционирование** — выводы по ценовому сегменту

Будь аналитическим, не бойся указывать на слабые стороны."""
    },
}


async def _get_knowledge_context(db: AsyncSession, client_id: UUID, limit: int = 30) -> str:
    result = await db.execute(
        select(KnowledgeItem)
        .where(KnowledgeItem.client_id == client_id)
        .limit(limit)
    )
    items = result.scalars().all()
    if not items:
        return "База знаний пуста."
    chunks = [item.content_edited or item.content for item in items]
    return "\n\n---\n\n".join(chunks)


@router.get("/sections")
async def get_sections():
    """Список доступных разделов маркетингового анализа."""
    return [
        {"id": k, "title": v["title"]}
        for k, v in MARKETING_SECTIONS.items()
    ]


@router.post("/clients/{client_id}/analyze/{section}")
async def analyze_section(
    client_id: UUID,
    section: str,
    body: MarketingRequest,
    db: AsyncSession = Depends(get_db),
):
    """Стриминговый маркетинговый анализ одного раздела."""
    if section not in MARKETING_SECTIONS:
        raise HTTPException(400, f"Раздел '{section}' не найден. Доступные: {list(MARKETING_SECTIONS.keys())}")

    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    knowledge = await _get_knowledge_context(db, client_id)
    section_config = MARKETING_SECTIONS[section]

    extra = ""
    if body.extra_context:
        extra = f"\n\nДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ:\n{body.extra_context}"
    if body.competitor_urls:
        extra += f"\n\nСАЙТЫ КОНКУРЕНТОВ (для сравнения):\n" + "\n".join(body.competitor_urls)

    system_prompt = f"""Ты — опытный маркетолог и бизнес-аналитик. Анализируешь компанию на основе базы знаний.

КОМПАНИЯ: {client.name}
САЙТ: {client.website_url}
НИША: {client.niche or "не определена"}

БАЗА ЗНАНИЙ КОМПАНИИ:
{knowledge}{extra}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": section_config["prompt"]},
    ]

    async def generate():
        async for chunk in stream_completion(messages, model="anthropic/claude-sonnet-4-5"):
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/clients/{client_id}/full-report")
async def full_report(
    client_id: UUID,
    body: MarketingRequest,
    db: AsyncSession = Depends(get_db),
):
    """Полный маркетинговый отчёт — все разделы одним запросом (не стриминг)."""
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Клиент не найден")

    knowledge = await _get_knowledge_context(db, client_id, limit=20)

    system_prompt = f"""Ты — опытный маркетолог и бизнес-аналитик. Анализируешь компанию.

КОМПАНИЯ: {client.name}
САЙТ: {client.website_url}
НИША: {client.niche or "не определена"}

БАЗА ЗНАНИЙ:
{knowledge}"""

    full_prompt = """Создай полный маркетинговый анализ компании. Структура:

## 1. Целевая аудитория
(3-4 портрета покупателя с болями и триггерами)

## 2. УТП и позиционирование
(ключевые преимущества и основное УТП в одной фразе)

## 3. Контент-стратегия
(10 тем для контента, форматы, ключевые слова)

## 4. Скрипты продаж
(приветствие, топ-3 возражения, скрипт закрытия)

## 5. Конкурентный анализ
(преимущества, слабости, стратегия дифференциации)

Будь конкретным. Опирайся только на данные из базы знаний."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": full_prompt},
    ]

    full_text = ""
    async for chunk in stream_completion(messages, model="anthropic/claude-sonnet-4-5"):
        full_text += chunk

    return {"report": full_text, "client": client.name}
