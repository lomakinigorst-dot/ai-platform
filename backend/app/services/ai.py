"""
AI-сервис: два провайдера.
- DeepSeek (прямой API) — диалоги в виджете, быстро, дёшево
- Claude Sonnet (Anthropic API) — маркетинг-анализ, ДНК, тексты — качество
"""
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from app.core.config import settings

_deepseek: AsyncOpenAI | None = None
_claude: AsyncAnthropic | None = None


def get_deepseek() -> AsyncOpenAI:
    global _deepseek
    if _deepseek is None:
        _deepseek = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
        )
    return _deepseek


def get_claude() -> AsyncAnthropic:
    global _claude
    if _claude is None:
        _claude = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _claude


# ── Диалоги (виджет, чат) ── DeepSeek ──────────────────────────────────────

async def stream_dialog(messages: list[dict]):
    """Стриминг ответа виджета — DeepSeek, быстро."""
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
    """Полный ответ (без стриминга) — DeepSeek."""
    resp = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=messages,
        temperature=0.7,
        max_tokens=800,
    )
    return resp.choices[0].message.content or ""


# ── Анализ и тексты ── Claude Sonnet ───────────────────────────────────────

async def stream_analysis(system: str, user: str, max_tokens: int = 4096):
    """Стриминг аналитики — Claude Sonnet, качество."""
    async with get_claude().messages.stream(
        model=settings.MODEL_ANALYSIS,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def complete_analysis(system: str, user: str, max_tokens: int = 4096) -> str:
    """Полный аналитический ответ без стриминга — для фоновых задач."""
    msg = await get_claude().messages.create(
        model=settings.MODEL_ANALYSIS,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text


# ── Обратная совместимость (старые эндпоинты используют эти имена) ──────────

async def stream_completion(messages: list[dict], model: str | None = None):
    """Устаревшее имя — роутим по модели."""
    if model and "claude" in model.lower():
        system = next((m["content"] for m in messages if m["role"] == "system"), "")
        user = next((m["content"] for m in messages if m["role"] == "user"), "")
        async for chunk in stream_analysis(system, user):
            yield chunk
    else:
        async for chunk in stream_dialog(messages):
            yield chunk


async def chat_completion(messages: list[dict], model: str | None = None, stream: bool = False):
    """Устаревшее имя — только не-стриминг."""
    return await complete_dialog(messages)
