"""
ДНК-анализ: 7-шаговый автоматический маркетинговый анализ.
Запускается после завершения сканирования сайта.
Результаты каждого шага сохраняются сразу — не ждём всё.
"""
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Client, KnowledgeItem
from app.services.ai import complete_analysis


async def _get_knowledge(db: AsyncSession, client_id: UUID, limit: int = 10) -> str:
    """Берём топ-N чанков базы знаний, не более 8000 символов суммарно."""
    result = await db.execute(
        select(KnowledgeItem)
        .where(KnowledgeItem.client_id == client_id)
        .limit(limit)
    )
    items = result.scalars().all()
    if not items:
        return "(база знаний пуста)"

    parts = []
    total_chars = 0
    for item in items:
        chunk = f"[{item.source_url or 'manual'}]\n{item.content[:600]}"
        total_chars += len(chunk)
        if total_chars > 8000:
            break
        parts.append(chunk)

    return "\n\n---\n\n".join(parts)


def _base_system(client: Client) -> str:
    return f"""Ты — старший маркетинговый аналитик с 20+ годами опыта.
Анализируешь компанию на основе данных с её сайта.

КОМПАНИЯ: {client.name}
САЙТ: {client.website_url}
НИША: {client.niche or "не определена"}
"""


async def run_dna_analysis(client_id: UUID) -> None:
    """
    Главная функция. Запускается как фоновая задача после index_website.
    Выполняет 7 шагов последовательно, сохраняя каждый в БД.
    """
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        client = await db.get(Client, client_id)
        if not client:
            return

        client.marketing_status = "running"
        client.marketing_data = {}
        await db.commit()

        try:
            knowledge = await _get_knowledge(db, client_id)
            system = _base_system(client)
            data: dict = {}

            # ── ШАГ 1: Анализ ниши ──────────────────────────────────────────
            result = await complete_analysis(
                system=system,
                user=f"""Проанализируй компанию по базе знаний сайта.

БАЗА ЗНАНИЙ:
{knowledge}

Определи и опиши:
1. **Что продаёт компания** — продукт или услуга, конкретно
2. **Целевой регион** — город, регион, страна или онлайн
3. **Сегмент рынка** — B2C, B2B, B2G
4. **Ценовой сегмент** — эконом / средний / премиум
5. **Основное позиционирование** — как компания себя преподносит
6. **Название компании** — извлеки из контента если не указано явно

Отвечай структурированно, конкретно. Без воды.""",
                max_tokens=1500,
            )
            data["niche_analysis"] = result
            client.marketing_data = dict(data)
            await db.commit()

            # ── ШАГ 2: Глубокий анализ ЦА (ДНК-промпт) ─────────────────────
            result = await complete_analysis(
                system=system + "\n\nДействуй как психолог-маркетолог. Твоя задача — вскрыть глубинные мотивы покупателей.",
                user=f"""КОМПАНИЯ: {client.name}
НИША: {data['niche_analysis'][:300]}
БАЗА ЗНАНИЙ:
{knowledge[:3000]}

Проведи глубокий психологический анализ целевой аудитории:

**БОЛИ И ПРОБЛЕМЫ** — что не даёт спать, какие проблемы решают покупая этот продукт
**СТРАХИ И БАРЬЕРЫ** — что останавливает от покупки, чего боятся
**ЖЕЛАНИЯ И МЕЧТЫ** — идеальная картина мира после решения проблемы
**ТРИГГЕРЫ** — что запускает желание купить именно сейчас
**ВОЗРАЖЕНИЯ** — топ-7 возражений и их психологические корни
**ЯЗЫК ЦА** — как они сами описывают свою проблему (дословные фразы)
**КОГНИТИВНЫЕ ИСКАЖЕНИЯ** — какие убеждения мешают принять решение

Для каждого пункта: 3-5 конкретных примеров из жизни реального покупателя.""",
                max_tokens=2000,
            )
            data["target_audience"] = result
            client.marketing_data = dict(data)
            await db.commit()

            # ── ШАГ 3: Аватары клиентов ─────────────────────────────────────
            result = await complete_analysis(
                system=system,
                user=f"""На основе анализа ЦА создай 3-4 детальных аватара покупателя.

АНАЛИЗ ЦА:
{data['target_audience'][:600]}

Для каждого аватара:
- **Имя и возраст** (вымышленные, но реалистичные)
- **Кто он** — должность/статус, семья, доход
- **Типичный день** — как выглядит его жизнь
- **Главная боль** — одна конкретная проблема связанная с нашим продуктом
- **Триггер покупки** — что заставит купить именно сейчас
- **Главное возражение** — почему может не купить
- **Как принимает решение** — что важно при выборе
- **Цитата** — как он сам описывает свою проблему

Аватары должны быть разными, охватывать разные сегменты.""",
                max_tokens=2000,
            )
            data["avatars"] = result
            client.marketing_data = dict(data)
            await db.commit()

            # ── ШАГ 4: Сценарии поиска ──────────────────────────────────────
            result = await complete_analysis(
                system=system,
                user=f"""Создай полную карту поисковых сценариев для компании.

АВАТАРЫ:
{data['avatars'][:500]}

**1. СЦЕНАРИИ ПОИСКА** — 6 ситуаций когда человек ищет этот продукт
**2. ТИПОЛОГИЯ ЗАПРОСОВ** — информационные / коммерческие / навигационные / транзакционные
**3. СЕМАНТИЧЕСКИЕ КЛАСТЕРЫ** — топ-10 ключевых фраз по каждому кластеру
**4. НЕГАТИВНЫЕ ЗАПРОСЫ** — что НЕ наши клиенты (минус-слова)
**5. СЛЕНГ И РАЗГОВОРНЫЕ ФОРМЫ** — как реально пишут в поисковике
**6. ПОИСКОВЫЕ ЦЕПОЧКИ** — путь от первого запроса до покупки

Конкретно, с примерами реальных запросов.""",
                max_tokens=2000,
            )
            data["search_scenarios"] = result
            client.marketing_data = dict(data)
            await db.commit()

            # ── ШАГ 5: Сегментация ──────────────────────────────────────────
            result = await complete_analysis(
                system=system,
                user=f"""Проведи сегментацию аудитории для таргетированной рекламы.

АВАТАРЫ:
{data['avatars'][:400]}

Опиши 4-5 рекламных сегментов. Для каждого:
- **Кто это** — социально-демографический портрет
- **Где найти** — площадки, группы, интересы для таргетинга
- **Что важно** — главные критерии выбора
- **Тон обращения** — официально/дружески/экспертно/с юмором
- **Рекламный подход** — механика объявления которая сработает
- **Пример заголовка** — конкретный заголовок для этого сегмента""",
                max_tokens=2000,
            )
            data["segments"] = result
            client.marketing_data = dict(data)
            await db.commit()

            # ── ШАГ 6: Заголовки, УТП, РСЯ ──────────────────────────────────
            result = await complete_analysis(
                system=system,
                user=f"""Создай рекламные материалы для первых двух сегментов.

СЕГМЕНТЫ:
{data['segments'][:500]}

Для каждого из 2 топ-сегментов:

**ЗАГОЛОВКИ (10 штук)**
- Разные механики: вопрос, выгода, цифры, страх, социальное доказательство

**УТП (5 штук)**
- Уникальное торговое предложение в одном предложении

**ОПИСАНИЯ РСЯ (5 штук)**
- 2-3 предложения для рекламной сети Яндекса

**БЫСТРЫЕ ССЫЛКИ (4 штуки)**
- Короткие заголовки для расширений объявлений""",
                max_tokens=2000,
            )
            data["utps_headlines"] = result
            client.marketing_data = dict(data)
            await db.commit()

            # ── ШАГ 7: Автозаполнение настроек AI-консультанта ──────────────
            result_json = await complete_analysis(
                system=system,
                user=f"""На основе маркетингового анализа создай настройки AI-консультанта.

НИША: {data['niche_analysis'][:200]}
ЦА (краткий): {data['target_audience'][:300]}
АВАТАРЫ (краткий): {data['avatars'][:200]}
ВОЗРАЖЕНИЯ И БОЛИ (из анализа ЦА): извлеки сам из данных выше

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{{
  "system_prompt": "Ты — [роль], консультант компании [название]. [описание задачи: что делаешь, как помогаешь]. Используй боли ЦА: [топ-3 боли]. Закрывай возражения: [топ-3 возражения с ответами]. Стиль: [тон общения].",
  "greeting": "Привет! Я [имя], консультант [компании]. [1-2 предложения чем могу помочь]. С чего начнём?",
  "quick_buttons": [
    "Сколько стоит?",
    "Как это работает?",
    "Есть ли [гарантия/примеры/отзывы]?"
  ],
  "faq": [
    {{"q": "вопрос", "a": "ответ"}},
    {{"q": "вопрос", "a": "ответ"}},
    {{"q": "вопрос", "a": "ответ"}},
    {{"q": "вопрос", "a": "ответ"}},
    {{"q": "вопрос", "a": "ответ"}}
  ]
}}""",
                max_tokens=2000,
            )
            # Парсим JSON из ответа
            try:
                # Убираем возможные markdown-обёртки
                clean = result_json.strip()
                if clean.startswith("```"):
                    clean = clean.split("```")[1]
                    if clean.startswith("json"):
                        clean = clean[4:]
                agent_settings = json.loads(clean.strip())
            except Exception:
                agent_settings = {"raw": result_json}

            data["agent_settings"] = agent_settings
            client.marketing_data = dict(data)

            # Применяем системный промпт и приветствие к консультанту
            if isinstance(agent_settings, dict):
                if "system_prompt" in agent_settings:
                    client.system_prompt = agent_settings["system_prompt"]

            client.marketing_status = "done"
            await db.commit()

        except Exception as e:
            client.marketing_status = "failed"
            await db.commit()
            raise
