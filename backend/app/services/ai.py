"""
AI-сервис: DeepSeek для всего (диалоги + анализ).
Claude Sonnet подключится позже когда появится ключ.
"""
from openai import AsyncOpenAI
from app.core.config import settings

_deepseek: AsyncOpenAI | None = None


def get_deepseek() -> AsyncOpenAI:
    global _deepseek
    if _deepseek is None:
        _deepseek = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
        )
    return _deepseek


# ── Диалоги (виджет, чат) — быстро, до 800 токенов ─────────────────────────

async def stream_dialog(messages: list[dict]):
    """Стриминг ответа виджета."""
    stream = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=messages,
        stream=True,
        temperature=0.7,
        max_tokens=800,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def complete_dialog(messages: list[dict]) -> str:
    """Полный ответ без стриминга."""
    resp = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=messages,
        temperature=0.7,
        max_tokens=800,
    )
    return resp.choices[0].message.content or ""


# ── Анализ и тексты — развёрнутые ответы, до 4000 токенов ──────────────────

async def stream_analysis(system: str, user: str, max_tokens: int = 4000):
    """Стриминг аналитического ответа — для маркетолога, отчётов."""
    stream = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        stream=True,
        temperature=0.3,   # меньше температура = точнее для анализа
        max_tokens=max_tokens,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def complete_analysis(system: str, user: str, max_tokens: int = 4000) -> str:
    """Полный аналитический ответ без стриминга — для фоновых задач (ДНК-анализ)."""
    resp = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""


# ── Совместимость со старым кодом ───────────────────────────────────────────

async def stream_completion(messages: list[dict], model: str | None = None):
    """Обёртка для старых эндпоинтов."""
    async for chunk in stream_dialog(messages):
        yield chunk


async def chat_completion(messages: list[dict], model: str | None = None, stream: bool = False):
    """Обёртка для старых эндпоинтов."""
    return await complete_dialog(messages)
