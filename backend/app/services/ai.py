"""
AI-сервис: DeepSeek V4 Flash для всех диалогов.
Gemini Flash 1.5 (через OpenRouter) для vision extraction (фото, аудио, видео).
"""
import httpx
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


# ── Vision extraction (Gemini Flash через OpenRouter) ────────────────────────

async def extract_vision(image_data_url: str, user_prompt: str = "") -> str:
    """
    Отправляет изображение/файл в Gemini Flash 1.5 (через OpenRouter).
    Возвращает текстовое описание — передаётся затем в DeepSeek.
    """
    prompt = user_prompt or "Подробно опиши что изображено на этом файле. Включи все важные детали: объекты, текст, цвета, контекст."
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.MODEL_VISION,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": image_data_url}},
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
                "max_tokens": 1000,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"] or ""


# ── DeepSeek V4 Flash — обычный стриминг ────────────────────────────────────

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


# ── DeepSeek V4 Flash — стриминг с thinking mode ────────────────────────────

async def stream_chat_thinking(messages: list[dict], max_tokens: int = 2000):
    """
    Стриминг Atlas-чата с thinking mode.
    Возвращает пары (type, chunk) где type = 'thinking' | 'text'.
    DeepSeek V4 Flash в thinking mode отдаёт reasoning_content + content.
    """
    stream = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=messages,
        stream=True,
        temperature=0.7,
        max_tokens=max_tokens,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta
        # reasoning_content — блок рассуждений (thinking mode)
        reasoning = getattr(delta, "reasoning_content", None)
        if reasoning:
            yield ("thinking", reasoning)
        # content — финальный ответ
        content = getattr(delta, "content", None)
        if content:
            yield ("text", content)


# ── Atlas и общий чат — обычный стриминг (без thinking) ─────────────────────

async def stream_chat(messages: list[dict], max_tokens: int = 2000):
    """Стриминг для Atlas без thinking mode (обратная совместимость)."""
    stream = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=messages,
        stream=True,
        temperature=0.7,
        max_tokens=max_tokens,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


# ── Анализ и тексты — развёрнутые ответы ────────────────────────────────────

async def stream_analysis(system: str, user: str, max_tokens: int = 4000):
    """Стриминг аналитического ответа — для маркетолога, отчётов."""
    stream = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        stream=True,
        temperature=0.3,
        max_tokens=max_tokens,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def complete_analysis(system: str, user: str, max_tokens: int = 4000) -> str:
    """Полный аналитический ответ без стриминга."""
    resp = await get_deepseek().chat.completions.create(
        model=settings.MODEL_DIALOG,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.3,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""


# ── Совместимость со старым кодом ───────────────────────────────────────────

async def stream_completion(messages: list[dict], model: str | None = None):
    async for chunk in stream_dialog(messages):
        yield chunk


async def chat_completion(messages: list[dict], model: str | None = None, stream: bool = False):
    return await complete_dialog(messages)
