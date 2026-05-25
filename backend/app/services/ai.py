from openai import AsyncOpenAI
from app.core.config import settings

_client = None

def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )
    return _client


async def chat_completion(messages: list[dict], model: str = None, stream: bool = False):
    client = get_client()
    return await client.chat.completions.create(
        model=model or settings.MODEL_DIALOG,
        messages=messages,
        stream=stream,
        temperature=0.7,
        max_tokens=1000,
    )


async def stream_completion(messages: list[dict], model: str = None):
    client = get_client()
    stream = await client.chat.completions.create(
        model=model or settings.MODEL_DIALOG,
        messages=messages,
        stream=True,
        temperature=0.7,
        max_tokens=1000,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
