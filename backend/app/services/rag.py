from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.models import KnowledgeItem
from app.services.embeddings import get_embedding


async def search_knowledge(
    db: AsyncSession,
    client_id: UUID,
    query: str,
    top_k: int = 5,
) -> list[str]:
    """Векторный поиск по базе знаний клиента."""
    query_embedding = await get_embedding(query)

    # pgvector cosine similarity search
    result = await db.execute(
        text("""
            SELECT content, content_edited, 1 - (embedding <=> :embedding) AS similarity
            FROM knowledge_items
            WHERE client_id = :client_id
              AND embedding IS NOT NULL
            ORDER BY embedding <=> :embedding
            LIMIT :top_k
        """),
        {
            "embedding": str(query_embedding),
            "client_id": str(client_id),
            "top_k": top_k,
        },
    )
    rows = result.fetchall()
    return [row.content_edited or row.content for row in rows]


def build_system_prompt(client, context_chunks: list[str]) -> str:
    mode = client.assistant_mode
    name = client.assistant_name
    context = "\n\n---\n\n".join(context_chunks) if context_chunks else "База знаний пуста."

    if mode == "sales":
        role_instruction = """Твоя задача — консультировать клиента и собирать контактные данные (имя, телефон).
Консультируй по продуктам и услугам компании.
Цену называй только если она есть в базе знаний, иначе говори что менеджер уточнит.
В конце разговора предложи оставить контакт для связи с менеджером.
Не давай контакты самого клиента пока он не спросил — сначала выясни потребность."""
    else:
        role_instruction = """Твоя задача — помочь клиенту разобраться с вопросом.
Отвечай точно по базе знаний. Если информации нет — честно скажи об этом.
Не выдумывай информацию которой нет в базе знаний."""

    return f"""Ты — {name}, AI-ассистент компании.

{role_instruction}

БАЗА ЗНАНИЙ КОМПАНИИ:
{context}

ПРАВИЛА:
- Отвечай только на русском языке
- Будь дружелюбным и профессиональным
- Не представляйся как AI или бот — ты консультант {name}
- Если вопрос не по теме компании — вежливо верни разговор к теме
- Пиши кратко, не более 3-4 предложений за раз"""
