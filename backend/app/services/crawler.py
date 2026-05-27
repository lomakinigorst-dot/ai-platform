"""
Smart phased website crawler.

Phase 1 – Map:       Discover all URLs via Firecrawl /map (fast, no content)
Phase 2 – Priority:  Scrape main page + standard pages (about/contacts/delivery)
Phase 3 – Structure: Analyse URL patterns → detect categories/services
Phase 4 – Categories: Scrape category landing pages + extract JSON-LD microdata
Phase 5 – Quality:   Score result; flag if deep scan is recommended

Rules:
- If site is unreachable → raise SiteUnavailableError immediately, no fallback
- Never invent data: only what's actually on the site
- Deep scan is a separate opt-in step, never triggered automatically
"""

import asyncio
import json
import re
from dataclasses import dataclass, field
from typing import Callable, Awaitable
from urllib.parse import urlparse, urljoin

import httpx

from app.core.config import settings

# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class SiteUnavailableError(Exception):
    """Site is unreachable or returned non-2xx on the main page."""


class CrawlError(Exception):
    """Generic crawl failure."""


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class CrawlPage:
    url: str
    title: str
    content: str          # markdown text
    folder: str           # display name for knowledge base folder
    microdata: list[dict] = field(default_factory=list)  # JSON-LD items


@dataclass
class SmartCrawlResult:
    pages: list[CrawlPage]
    quality_score: int        # 0–100
    needs_deep_scan: bool
    total_urls_found: int
    categories: list[str]
    scan_phases: list[str]    # names of phases completed


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def extract_domain(url: str) -> str:
    parsed = urlparse(url if url.startswith("http") else f"https://{url}")
    return parsed.netloc.lstrip("www.")


def normalize_url(url: str) -> str:
    if not url.startswith("http"):
        return f"https://{url}"
    return url.rstrip("/")


# Priority page patterns → folder name (checked in order, first match wins)
_PRIORITY_PATTERNS: list[tuple[list[str], str]] = [
    (["kontakty", "contacts", "contact", "svyaz", "svyazatsya", "about-us/contact"], "Контакты"),
    (["o-nas", "o-kompanii", "o-sebe", "about", "about-us", "company", "kompaniya", "o_nas"], "О компании"),
    (["dostavka", "delivery", "shipping", "доставка"], "Доставка"),
    (["oplata", "payment", "pay", "оплата"], "Оплата"),
    (["garantiya", "garantii", "warranty", "guarantee"], "Гарантия"),
    (["catalog", "katalog", "products", "tovary", "shop", "uslugi", "services", "price", "prices",
      "прайс", "каталог"], "Каталог"),
    (["news", "novosti", "blog", "articles", "stati"], "Новости"),
]

_CATEGORY_PATTERNS = [
    "catalog", "katalog", "cat", "category", "products", "tovary", "shop",
    "uslugi", "services", "razdel", "section",
]


def _classify_url(path: str) -> str | None:
    """Return folder name for a URL path, or None if it doesn't match priorities."""
    path_lower = path.lower().strip("/")
    for patterns, folder in _PRIORITY_PATTERNS:
        for p in patterns:
            if path_lower == p or path_lower.startswith(p + "/") or path_lower.startswith(p + "-"):
                return folder
    return None


def _is_category_url(path: str) -> bool:
    path_lower = path.lower().strip("/")
    return any(path_lower.startswith(p) for p in _CATEGORY_PATTERNS)


def _is_leaf_url(path: str) -> bool:
    """True if path looks like an individual product/page (has numeric id or deep nesting)."""
    parts = [p for p in path.strip("/").split("/") if p]
    if len(parts) >= 3:
        return True
    last = parts[-1] if parts else ""
    if re.search(r"\d{4,}", last):  # long numeric id
        return True
    return False


# ---------------------------------------------------------------------------
# Firecrawl API wrappers
# ---------------------------------------------------------------------------

_FC_BASE = "https://api.firecrawl.dev/v1"
_HEADERS = lambda: {"Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}"}


async def _check_site_reachable(url: str, client: httpx.AsyncClient) -> None:
    """Quickly HEAD the main page; raise SiteUnavailableError if unreachable."""
    try:
        r = await client.head(url, follow_redirects=True, timeout=10)
        if r.status_code >= 400:
            raise SiteUnavailableError(
                f"Сайт вернул статус {r.status_code}. Проверьте URL."
            )
    except httpx.TimeoutException:
        raise SiteUnavailableError("Сайт не отвечает (таймаут). Проверьте URL.")
    except httpx.ConnectError:
        raise SiteUnavailableError("Не удалось подключиться к сайту. Проверьте URL.")


async def _map_site(base_url: str, client: httpx.AsyncClient) -> list[str]:
    """Return list of discovered URLs (Firecrawl /map). Fast, no content."""
    try:
        r = await client.post(
            f"{_FC_BASE}/map",
            headers=_HEADERS(),
            json={"url": base_url, "limit": 300, "includeSubdomains": False},
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("links", [])
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 402:
            raise CrawlError("Firecrawl: лимит запросов исчерпан")
        raise CrawlError(f"Firecrawl /map вернул {e.response.status_code}")
    except Exception as e:
        raise CrawlError(f"Ошибка при получении карты сайта: {e}")


async def _scrape_page(url: str, client: httpx.AsyncClient) -> CrawlPage | None:
    """Scrape a single page; return None on error (don't crash the whole scan)."""
    try:
        r = await client.post(
            f"{_FC_BASE}/scrape",
            headers=_HEADERS(),
            json={
                "url": url,
                "formats": ["markdown", "rawHtml"],
                "excludeTags": ["nav", "footer", "script", "style", "head"],
                "timeout": 20000,
            },
            timeout=35,
        )
        r.raise_for_status()
        data = r.json().get("data", {})

        markdown = data.get("markdown", "").strip()
        if not markdown:
            return None

        meta = data.get("metadata", {})
        title = meta.get("title") or meta.get("ogTitle") or url
        raw_html = data.get("rawHtml", "")
        microdata = _extract_json_ld(raw_html)

        parsed = urlparse(url)
        folder = _classify_url(parsed.path) or "Сайт"

        return CrawlPage(url=url, title=title, content=markdown, folder=folder, microdata=microdata)
    except Exception:
        return None


async def _scrape_pages_parallel(urls: list[str], client: httpx.AsyncClient, max_parallel: int = 5) -> list[CrawlPage]:
    """Scrape multiple pages with bounded concurrency."""
    sem = asyncio.Semaphore(max_parallel)

    async def _bounded(url: str) -> CrawlPage | None:
        async with sem:
            return await _scrape_page(url, client)

    results = await asyncio.gather(*[_bounded(u) for u in urls])
    return [r for r in results if r is not None]


# ---------------------------------------------------------------------------
# JSON-LD microdata extraction
# ---------------------------------------------------------------------------

def _extract_json_ld(html: str) -> list[dict]:
    """Extract all JSON-LD blocks from raw HTML."""
    pattern = re.compile(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        re.DOTALL | re.IGNORECASE,
    )
    result: list[dict] = []
    for m in pattern.finditer(html):
        try:
            obj = json.loads(m.group(1).strip())
            if isinstance(obj, list):
                result.extend(obj)
            elif isinstance(obj, dict):
                result.append(obj)
        except json.JSONDecodeError:
            pass
    return result


def _microdata_to_text(items: list[dict]) -> str:
    """Convert JSON-LD objects to readable text for knowledge base."""
    lines: list[str] = []
    for item in items:
        t = item.get("@type", "")
        if t in ("Product", "Offer"):
            name = item.get("name", "")
            desc = item.get("description", "")
            price = ""
            offers = item.get("offers", item.get("Offers", {}))
            if isinstance(offers, dict):
                price = str(offers.get("price", ""))
                currency = offers.get("priceCurrency", "")
                avail = offers.get("availability", "").replace("https://schema.org/", "")
                if price:
                    price = f"{price} {currency}".strip()
                    if avail:
                        price += f" ({avail})"
            parts = [f"Товар: {name}" if name else ""]
            if desc:
                parts.append(f"Описание: {desc}")
            if price:
                parts.append(f"Цена: {price}")
            lines.append("\n".join(p for p in parts if p))

        elif t in ("Organization", "LocalBusiness"):
            name = item.get("name", "")
            desc = item.get("description", "")
            tel = item.get("telephone", "")
            email = item.get("email", "")
            addr = item.get("address", {})
            addr_str = addr.get("streetAddress", "") if isinstance(addr, dict) else str(addr)
            parts = [f"Организация: {name}" if name else ""]
            if desc:
                parts.append(f"О компании: {desc}")
            if tel:
                parts.append(f"Телефон: {tel}")
            if email:
                parts.append(f"Email: {email}")
            if addr_str:
                parts.append(f"Адрес: {addr_str}")
            lines.append("\n".join(p for p in parts if p))

        elif t in ("Service",):
            name = item.get("name", "")
            desc = item.get("description", "")
            parts = [f"Услуга: {name}" if name else ""]
            if desc:
                parts.append(f"Описание: {desc}")
            lines.append("\n".join(p for p in parts if p))

        elif t in ("BreadcrumbList",):
            crumbs = item.get("itemListElement", [])
            names = [c.get("item", {}).get("name", c.get("name", ""))
                     for c in crumbs if isinstance(c, dict)]
            if names:
                lines.append("Навигация: " + " > ".join(n for n in names if n))

    return "\n\n".join(lines)


# ---------------------------------------------------------------------------
# Quality scoring
# ---------------------------------------------------------------------------

def _quality_score(pages: list[CrawlPage]) -> int:
    """0–100 score. <30 = recommend deep scan."""
    if not pages:
        return 0
    total_chars = sum(len(p.content) for p in pages)
    microdata_count = sum(len(p.microdata) for p in pages)
    folders = {p.folder for p in pages}
    key_folders = {"О компании", "Контакты", "Доставка"}
    coverage = len(key_folders & folders) / len(key_folders)

    score = 0
    score += min(40, total_chars // 500)       # content volume (max 40)
    score += min(30, microdata_count * 3)       # structured data (max 30)
    score += int(coverage * 20)                 # key page coverage (max 20)
    score += min(10, len(pages))                # breadth (max 10)
    return min(100, score)


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def smart_crawl(
    url: str,
    progress: Callable[[str, int], Awaitable[None]] | None = None,
) -> SmartCrawlResult:
    """
    Smart phased crawl. Raises SiteUnavailableError if site is unreachable.
    Never fetches data from sources other than the target site.
    """

    async def _progress(phase: str, pct: int):
        if progress:
            await progress(phase, pct)

    base_url = normalize_url(url)
    phases_done: list[str] = []

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:

        # ── Phase 1: Reachability check ──────────────────────────────────
        await _progress("Проверка доступности сайта", 5)
        await _check_site_reachable(base_url, client)
        phases_done.append("reachability")

        # ── Phase 2: Map ──────────────────────────────────────────────────
        await _progress("Получение структуры сайта", 15)
        all_urls: list[str] = []
        try:
            all_urls = await _map_site(base_url, client)
        except CrawlError:
            all_urls = [base_url]   # fallback: at least scrape main page
        phases_done.append("map")

        # ── Phase 3: Select priority pages ───────────────────────────────
        await _progress("Выбор ключевых страниц", 25)
        parsed_base = urlparse(base_url)

        priority_urls: list[str] = [base_url]   # always include main
        category_urls: list[str] = []
        seen: set[str] = {base_url}

        for raw_url in all_urls:
            if not raw_url.startswith(base_url):
                continue
            path = urlparse(raw_url).path
            if _is_leaf_url(path):
                continue

            folder = _classify_url(path)
            if folder and raw_url not in seen:
                priority_urls.append(raw_url)
                seen.add(raw_url)
            elif _is_category_url(path) and raw_url not in seen:
                category_urls.append(raw_url)
                seen.add(raw_url)

        # Limit to avoid burning Firecrawl quota
        priority_urls = priority_urls[:12]
        category_urls = category_urls[:10]

        phases_done.append("select")

        # ── Phase 4: Scrape priority pages in parallel ───────────────────
        await _progress("Сканирование основных страниц", 40)
        priority_pages = await _scrape_pages_parallel(priority_urls, client, max_parallel=5)
        phases_done.append("priority")

        # ── Phase 5: Scrape category pages ───────────────────────────────
        await _progress("Сканирование категорий", 65)
        category_pages = await _scrape_pages_parallel(category_urls, client, max_parallel=4)
        for p in category_pages:
            if p.folder == "Сайт":
                p.folder = "Каталог"
        phases_done.append("categories")

        all_pages = priority_pages + category_pages

        # ── Phase 6: Detect site categories from URLs ────────────────────
        await _progress("Анализ структуры", 80)
        detected_categories = _detect_categories(all_urls, base_url)
        phases_done.append("structure")

    # ── Phase 7: Quality scoring ──────────────────────────────────────────
    score = _quality_score(all_pages)

    return SmartCrawlResult(
        pages=all_pages,
        quality_score=score,
        needs_deep_scan=score < 35,
        total_urls_found=len(all_urls),
        categories=detected_categories,
        scan_phases=phases_done,
    )


async def deep_crawl(url: str, progress: Callable | None = None) -> SmartCrawlResult:
    """
    Deep scan: full Firecrawl crawl up to 80 pages.
    Only called explicitly by the user when initial scan quality is low.
    """
    base_url = normalize_url(url)

    async with httpx.AsyncClient(timeout=120) as client:
        await _check_site_reachable(base_url, client)

        resp = await client.post(
            f"{_FC_BASE}/crawl",
            headers=_HEADERS(),
            json={
                "url": base_url,
                "limit": 80,
                "scrapeOptions": {
                    "formats": ["markdown", "rawHtml"],
                    "excludeTags": ["nav", "footer", "script", "style"],
                },
            },
        )
        resp.raise_for_status()
        job_id = resp.json().get("id")
        if not job_id:
            raise CrawlError("Firecrawl не вернул job_id")

        for _ in range(60):
            await asyncio.sleep(5)
            s = await client.get(f"{_FC_BASE}/crawl/{job_id}", headers=_HEADERS())
            s.raise_for_status()
            data = s.json()
            if data.get("status") == "completed":
                pages = []
                for p in data.get("data", []):
                    md = p.get("markdown", "").strip()
                    if not md:
                        continue
                    meta = p.get("metadata", {})
                    raw = p.get("rawHtml", "")
                    src = meta.get("sourceURL", "")
                    path = urlparse(src).path
                    folder = _classify_url(path) or ("Каталог" if _is_category_url(path) else "Сайт")
                    pages.append(CrawlPage(
                        url=src,
                        title=meta.get("title", src),
                        content=md,
                        folder=folder,
                        microdata=_extract_json_ld(raw),
                    ))
                score = _quality_score(pages)
                return SmartCrawlResult(
                    pages=pages, quality_score=score, needs_deep_scan=False,
                    total_urls_found=len(pages),
                    categories=_detect_categories([p.url for p in pages], base_url),
                    scan_phases=["deep_crawl"],
                )
            if data.get("status") == "failed":
                raise CrawlError("Глубокое сканирование завершилось с ошибкой")

        raise CrawlError("Глубокое сканирование не завершилось за 5 минут")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _detect_categories(urls: list[str], base_url: str) -> list[str]:
    """Extract top-level category names from URL patterns."""
    categories: dict[str, int] = {}
    for u in urls:
        if not u.startswith(base_url):
            continue
        path = urlparse(u).path.strip("/")
        parts = path.split("/")
        if len(parts) >= 2 and _is_category_url(parts[0]):
            cat = parts[1].replace("-", " ").replace("_", " ").title()
            if cat and len(cat) > 1:
                categories[cat] = categories.get(cat, 0) + 1
    return sorted(categories, key=lambda k: -categories[k])[:15]


def extract_contacts(pages: list[CrawlPage]) -> dict:
    all_text = " ".join(p.content for p in pages)
    phones = list(set(re.findall(
        r"[\+7|8][\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}", all_text
    )))
    emails = list(set(re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", all_text)))
    return {"phones": phones[:10], "emails": emails[:10]}


def detect_niche(pages: list[CrawlPage]) -> str:
    all_text = " ".join(p.content for p in pages).lower()
    scores = {
        "ecommerce":    sum(all_text.count(w) for w in ["купить", "корзина", "каталог", "цена", "доставка"]),
        "real_estate":  sum(all_text.count(w) for w in ["недвижимость", "квартира", "аренда"]),
        "medical":      sum(all_text.count(w) for w in ["клиника", "врач", "лечение", "приём"]),
        "b2b":          sum(all_text.count(w) for w in ["b2b", "оптом", "партнёрам", "юридическим лицам"]),
        "services":     sum(all_text.count(w) for w in ["услуги", "заявка", "консультация"]),
        "industrial":   sum(all_text.count(w) for w in ["комплектующие", "оборудование", "промышленн", "станк"]),
    }
    return max(scores, key=scores.get) if max(scores.values()) > 0 else "other"
