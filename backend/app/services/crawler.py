import re
from urllib.parse import urlparse

import httpx

from app.core.config import settings


def extract_domain(url: str) -> str:
    parsed = urlparse(url if url.startswith("http") else f"https://{url}")
    return parsed.netloc.lstrip("www.")


def normalize_url(url: str) -> str:
    if not url.startswith("http"):
        return f"https://{url}"
    return url


async def crawl_website(url: str, limit: int = 50) -> dict:
    """
    Сканирует сайт через Firecrawl API.
    Возвращает список страниц с текстом.
    """
    async with httpx.AsyncClient(timeout=120) as client:
        # Запускаем краулинг
        resp = await client.post(
            "https://api.firecrawl.dev/v1/crawl",
            headers={"Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}"},
            json={
                "url": normalize_url(url),
                "limit": limit,
                "scrapeOptions": {
                    "formats": ["markdown"],
                    "excludeTags": ["nav", "footer", "header", "script", "style"],
                },
            },
        )
        resp.raise_for_status()
        job = resp.json()
        job_id = job.get("id")

        if not job_id:
            raise ValueError(f"Firecrawl не вернул job_id: {job}")

        # Ждём завершения
        for _ in range(60):  # max 5 минут
            await _sleep(5)
            status_resp = await client.get(
                f"https://api.firecrawl.dev/v1/crawl/{job_id}",
                headers={"Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}"},
            )
            status_resp.raise_for_status()
            data = status_resp.json()

            if data.get("status") == "completed":
                pages = data.get("data", [])
                return {
                    "pages": [
                        {
                            "url": p.get("metadata", {}).get("sourceURL", ""),
                            "title": p.get("metadata", {}).get("title", ""),
                            "content": p.get("markdown", ""),
                        }
                        for p in pages
                        if p.get("markdown")
                    ],
                    "total": len(pages),
                }

            if data.get("status") == "failed":
                raise RuntimeError(f"Firecrawl job failed: {data}")

        raise TimeoutError("Firecrawl job timed out after 5 minutes")


async def _sleep(seconds: int):
    import asyncio
    await asyncio.sleep(seconds)


def extract_contacts(pages: list[dict]) -> dict:
    """Извлекает контакты из текста страниц."""
    all_text = " ".join(p.get("content", "") for p in pages)

    phones = list(set(re.findall(
        r"[\+7|8][\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}", all_text
    )))
    emails = list(set(re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", all_text)))
    addresses = []  # TODO: NLP для адресов

    return {"phones": phones[:10], "emails": emails[:10], "addresses": addresses}


def detect_niche(pages: list[dict]) -> str:
    """Простое определение ниши по ключевым словам."""
    all_text = " ".join(p.get("content", "") for p in pages).lower()

    scores = {
        "ecommerce": sum(all_text.count(w) for w in ["купить", "корзина", "каталог", "цена", "доставка"]),
        "real_estate": sum(all_text.count(w) for w in ["недвижимость", "квартира", "аренда", "продажа квартир"]),
        "medical": sum(all_text.count(w) for w in ["клиника", "врач", "лечение", "приём", "медицин"]),
        "b2b": sum(all_text.count(w) for w in ["b2b", "оптом", "партнёрам", "юридическим лицам"]),
        "services": sum(all_text.count(w) for w in ["услуги", "заявка", "консультация", "звоните"]),
    }
    return max(scores, key=scores.get) if max(scores.values()) > 0 else "other"
