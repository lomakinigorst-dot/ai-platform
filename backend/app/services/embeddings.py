import httpx
from app.core.config import settings


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Разбивает текст на чанки с перекрытием."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i: i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


async def get_embedding(text: str) -> list[float]:
    """Получает векторное представление текста через OpenRouter / DeepSeek."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/text-embedding-3-small",
                "input": text[:8000],  # лимит токенов
            },
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Получает эмбеддинги батчем."""
    import asyncio
    tasks = [get_embedding(t) for t in texts]
    return await asyncio.gather(*tasks)
