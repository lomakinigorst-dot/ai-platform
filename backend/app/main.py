import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from app.core.config import settings

app = FastAPI(
    title="AI Platform",
    version="1.0.0",
    docs_url="/api/docs",
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://ai.lomakin-igor.ru",
    f"http://{settings.BASE_DOMAIN}",
    f"https://{settings.BASE_DOMAIN}",
    f"https://www.{settings.BASE_DOMAIN}",
    f"https://*.{settings.BASE_DOMAIN}",
]
# В dev-режиме разрешаем всё с localhost
if settings.ENVIRONMENT == "development":
    ALLOWED_ORIGINS += ["http://localhost:3001", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Виджет устанавливается на любые сайты клиентов — разрешаем любой origin
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статика виджета (widget/src/widget.js и widget/demo.html)
WIDGET_DIR = Path(__file__).parent.parent.parent / "widget"
if WIDGET_DIR.exists():
    app.mount("/static/widget", StaticFiles(directory=str(WIDGET_DIR / "src")), name="widget-src")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


from app.api.v1.endpoints import clients, chat, dashboard, knowledge, settings as settings_router, auth, marketing, atlas, portal
app.include_router(auth.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(settings_router.router, prefix="/api/v1")
app.include_router(marketing.router, prefix="/api/v1")
app.include_router(atlas.router, prefix="/api/v1")
app.include_router(portal.router, prefix="/api/v1")
