# Progress Tracker
> Обновляется после каждой выполненной задачи
> **Цель:** полный рабочий партнёрский кабинет + деплой на Timeweb
> **MVP-демо:** кабинет агентства + кабинет клиента + AI Консультант + AI Маркетолог (ДНК)

---

## ФАЗА 0 — Фундамент ✅ ГОТОВО

- [x] PostgreSQL + pgvector в Docker
- [x] Redis в Docker
- [x] FastAPI backend (JWT авторизация, CRUD клиентов, RAG pipeline)
- [x] Next.js frontend (App Router, TypeScript, Tailwind, Recharts)
- [x] Widget (vanilla JS, SSE стриминг, захват лидов)
- [x] JWT авторизация (AGENT_EMAIL / AGENT_PASSWORD)
- [x] RAG pipeline (pgvector + OpenRouter embeddings)
- [x] Chat SSE streaming (DeepSeek прямой API)
- [x] ДНК-анализ: 7 шагов, автозапуск, результаты в marketing_data

---

## ФАЗА 1 — UI Редизайн ✅ ГОТОВО (2026-05-26)

- [x] AIRail: тёмный `#1a1535`, 48px→224px, 7 AI-блоков
- [x] AIRail toggle: Zap+4px при ховере, линия → стрелка (CSS shapes)
- [x] BlockSubNav: 220px, тёмная шапка, AtlasSubNav, locked-блоки с CTA
- [x] TopNav: тёмный, баланс ₽+дней, уведомления, дропдауны
- [x] URL-based activeBlock (без useState)
- [x] LoginPage, Dashboard, ClientsPage, ClientDetailPage (6 табов)
- [x] AtlasPage: SSE стриминг DeepSeek
- [x] Клиентский портал /portal/[token]

---

## ФАЗА 2 — Умный сканер ✅ ГОТОВО (2026-05-27)

- [x] **crawler.py полная переработка** — 5-фазный умный сканер
- [x] **Tier 1 → Tier 2 стратегия:**
  - Tier 1: прямой httpx + sitemap.xml (бесплатно, без квоты)
  - Tier 2: Firecrawl только при 403/429/Cloudflare/CAPTCHA
- [x] Детекция блокировки по статус-коду + маркерам в теле
- [x] JSON-LD / Schema.org микроданные (Product, Organization, Service)
- [x] Оценка качества 0-100 + рекомендация глубокого сканирования
- [x] Глубокое сканирование opt-in (Firecrawl /crawl до 80 страниц)
- [x] Папки для чанков (Контакты, О компании, Каталог, Доставка и др.)
- [x] **Новые поля БД + миграции применены:**
  - `knowledge_items.folder`
  - `clients.scan_phase`, `scan_quality`, `needs_deep_scan`
- [x] KnowledgeTab: чанки по папкам, баннер качества, кнопка «Глубокое сканирование»

---

## ФАЗА 3 — Полный партнёрский кабинет 🚀 В РАБОТЕ (2026-05-27)

### Шаг 1: Навигация Консультанта
- [ ] Добавить «Клиенты» в BlockSubNav (consultant)
- [ ] Проверить что все пункты меню ведут на существующие страницы

### Шаг 2: Недостающие страницы
- [ ] `/leads` — агрегированные лиды по всем клиентам (таблица + фильтр по клиенту)
- [ ] `/conversations` — агрегированные диалоги (таблица + фильтр + просмотр переписки)
- [ ] `/analytics` — аналитика агентства (графики, топ клиентов)
- [ ] `/settings` — настройки агентства (профиль, биллинг-заглушка, тариф)

### Шаг 3: Маркетолог
- [ ] `/marketing` — реальная страница: выбор клиента → ДНК результаты 7 секций

### Шаг 4: Kanban лидов
- [ ] Вкладка «Лиды» в карточке клиента → добавить Kanban воронку (drag-and-drop)
  Столбцы: Новый → В работе → Контакт → Закрыт

### Шаг 5: Тестирование
- [ ] Установить Playwright в frontend
- [ ] Создать скилл `/test` (Claude Code slash command)
- [ ] Smoke тесты: логин, список клиентов, детальная карточка, чат

---

## ФАЗА 4 — Деплой на Timeweb Cloud

**Сервер:** AI-ATLAS, 91.186.196.137
**Статус:** Ждём Timeweb поддержку — на сервере нет интернета (firewall сломал DNS)

- [x] `frontend/Dockerfile` — multi-stage standalone Next.js
- [x] `docker-compose.prod.yml` — prod стек
- [x] `nginx.conf` — reverse proxy + SSE
- [x] Код на GitHub (ветка main, актуален)
- [ ] Поддержка Timeweb восстанавливает интернет на сервере
- [ ] Деплой через web-консоль Timeweb
- [ ] Alembic миграции на прод БД
- [ ] End-to-end проверка

---

## ФАЗА 5 — После деплоя

- [ ] Telegram интеграция для консультанта
- [ ] Настройки виджета: аватар, цвет, позиция
- [ ] Рассылки (/campaigns) — Маркетолог Phase 2
- [ ] Каналы: WhatsApp (Wazzup), VK, Авито
- [ ] Биллинг и тарифы (реальный)
- [ ] Лендинг (публичный сайт)

---

Последнее обновление: 2026-05-27
Текущий шаг: Фаза 3 — Полный партнёрский кабинет (в работе)
