# AI Platform — Master Plan
> Обновлён: 2026-05-27 | Версия: 2.3
> Этот файл — главный источник правды. Читай перед каждой сессией.

---

## ПРОДУКТ

**AI SaaS платформа** для агентств (интеграторов) — добавляют клиентов, сканируют сайты, запускают AI-модули.

**Два кабинета:**
- **Кабинет агентства** (партнёра) — управляет клиентами, видит агрегированную аналитику, настраивает AI-блоки
- **Кабинет клиента** — /portal/[token] — видит только свои данные (статистика, лиды, ДНК)

**6 AI-блоков:**
1. AI-Консультант — виджет на сайт, захват лидов, RAG (основной, в работе)
2. AI-Маркетолог — ДНК-анализ аудитории, рассылки (ДНК готово, рассылки Phase 2)
3. AI-Атлас — AI-оркестратор (чат + 61 сценарий по 6 блокам + confirm flow)
4. AI-HR — воронка найма (Phase 3, под замком)
5. AI-Финансы — P&L, ДДС: партнёрский + клиентский вид
6. AI-Юрист / AI-Продажи (Phase 4, под замком)

---

## СТЕК

```
Frontend:  Next.js (App Router) + TypeScript + Tailwind CSS + Recharts
Backend:   Python 3.12 + FastAPI + SQLAlchemy async + Alembic
DB:        PostgreSQL + pgvector (Docker)
Cache:     Redis (Docker)
AI:        DeepSeek API (чат + анализ), OpenRouter (embeddings), Firecrawl (скрапинг tier-2)
Hosting:   Timeweb Cloud VPS, 194.26.138.166, Ubuntu 24.04, 4GB RAM
Domain:    http://ai.lomakin-igor.ru
```

---

## ДИЗАЙН-СИСТЕМА

```
Фон приложения:     #f4f3f8
Surface (карточки): #ffffff
AIRail / TopNav:    #1a1535 (тёмно-фиолетовый)
Primary:            #6b5fd4 (фиолетовый)
Accent:             #f97316 (оранжевый)
Text:               #111827
Text muted:         #6b7280
Border:             #e5e7eb
Radius:             12px карточки, 8px кнопки
```

**Layout (AppShell):**
- AIRail слева: 48px свёрнут → 224px развёрнут, 7 AI-блоков, фон #1a1535
- BlockSubNav: 220px, белый фон + тёмная шапка #1a1535
- TopNav: горизонтально сверху, тёмный #1a1535, баланс/уведомления/аккаунт
- Main content: светлый фон #f4f3f8

**AIRail toggle:** под Zap-иконкой линия `——` в покое → стрелка `——→` при ховере, +4px вправо

---

## ТЕКУЩЕЕ СОСТОЯНИЕ (2026-05-27)

### ✅ Платформа задеплоена и работает на проде

**Адрес:** http://ai.lomakin-igor.ru
**Логин:** lomakin.igor.st@gmail.com / Atlas2026!
**Сервер root:** root / t8Te+y3PoL+L7_ (ssh root@194.26.138.166)

**Обновить на сервере:**
```bash
cd /app && git pull origin main
docker compose -f docker-compose.prod.yml build [service]
docker compose -f docker-compose.prod.yml up -d [service]
# миграции:
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### ✅ Backend (FastAPI)
- JWT авторизация (AGENT_EMAIL / AGENT_PASSWORD из .env)
- Клиенты: CRUD, умное сканирование (5-фазный crawler)
- **Умный сканер:** Tier 1 (httpx + sitemap.xml) → Tier 2 (Firecrawl только при блокировках)
- **JSON-LD / Schema.org:** извлечение микроданных (Product, Organization, Service)
- **Оценка качества сканирования 0-100** + рекомендация глубокого сканирования
- **Папки в базе знаний:** каждый чанк классифицируется в папку
- RAG pipeline: pgvector embeddings через OpenRouter
- Chat SSE streaming: DeepSeek → виджет
- ДНК-анализ: 7 шагов маркетинга, автозапуск после сканирования
- Atlas chat SSE стриминг ✅ (проверен на проде)
- Клиентский портал (токен), лиды, диалоги, email-уведомления
- Demo-ссылка: /api/v1/chat/demo/{domain}
- **Dashboard API:** агрегированные лиды / диалоги / аналитика по всем клиентам

### ✅ Frontend (Next.js)
- **AppShell**: AIRail (7 блоков) + BlockSubNav + TopNav
- **AtlasPage**: чат с историей, SSE, quick chips
- **Dashboard** (/): KPI-карточки, график, таблица клиентов
- **ClientsPage** (/clients): реальный API, KPI-карточки, таблица
- **ClientDetailPage** (/clients/[id]): 6 табов (Обзор, Лиды, Диалоги, База знаний, Маркетолог, Настройки)
- **KnowledgeTab**: чанки по папкам, качество 0-100, баннер глубокого сканирования
- **LeadsPage** (/leads): реальный API, фильтры, статусы, обновление через useMutation
- **ConversationsPage** (/conversations): реальный API, KPI-фильтры, диалог-модал с сообщениями
- **AnalyticsPage** (/analytics): реальный API, KPI-сетка, бар-чарт, топ-клиенты
- **Портал клиента** (/portal/[token]): статистика, лиды, ДНК — без логина
- **Embed-код** в SettingsTab → `http://ai.lomakin-igor.ru/widget.js`

### ✅ Widget
- Файл: `http://ai.lomakin-igor.ru/widget.js`
- SSE стриминг, захват лидов, UTM
- Default `API_BASE = 'http://ai.lomakin-igor.ru'`
- CORS: `allow_origin_regex=r"https?://.*"` — работает с любых сайтов клиентов

### 🔑 API ключи (в .env.prod на сервере)
- DeepSeek (sk-bdbff...) — диалоги + анализ
- OpenRouter (sk-or-v1-...) — embeddings
- Firecrawl (fc-3d18...) — tier-2 скрапинг
- Anthropic — НЕТ ключа (Claude не используется пока)

---

## ЧТО ДЕЛАЕМ ДАЛЬШЕ (ПРИОРИТЕТ)

### 1. 🔴 Kanban лидов (ПРИОРИТЕТ #1)
Канбан-воронка внутри карточки клиента — вкладка «Лиды».
Статусы: `new → contacted → qualified → won / lost`
Конкуренты: intly.ru, b24u.ru — оба имеют Kanban.

### 2. 🟠 Telegram-интеграция для консультанта
Подключить бот ТГ как канал: посетитель пишет в бот → RAG-ответ → лид в кабинет.

### 3. 🟡 Страница /marketing — ДНК напрямую
Сейчас заглушка. Нужна реальная страница: список клиентов → ДНК-анализ → статус шагов.

### 4. 🟡 Создать тестового клиента на проде
Добавить nt-g.ru через UI, пересканировать, проверить полный flow виджета.

### 5. 🟢 Настройки виджета
Кастомизация: цвет, аватар, позиция кнопки, приветственное сообщение.

---

## АРХИТЕКТУРНЫЕ ПРАВИЛА

### Не делать
- Не показывать названия AI-моделей пользователю
- Не делать сложный онбординг
- Не давать оператору вклиниться в диалог
- Не добавлять фичи не из плана без обсуждения

### Как делать
- Next.js App Router (НЕ Pages Router)
- API вызовы только через `src/lib/api.ts`
- URL-derived activeBlock в AppShell (нет useState для activeBlock)
- CSS переменные — не хардкодить цвета где можно
- Токен портала хранить в widget_settings JSON

---

## ЗАПУСК ДЛЯ РАЗРАБОТКИ

```bash
# Docker (PostgreSQL + Redis)
docker compose up -d

# Backend
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000 --env-file ../.env

# Frontend
cd frontend && npm run dev
```

---

## КЛЮЧЕВЫЕ ФАЙЛЫ

```
ai-platform/
├── PLAN.md                          ← этот файл (главный источник правды)
├── progress.md                      ← детальный чеклист по шагам
├── .env                             ← API ключи (не коммитить!)
├── docker-compose.prod.yml          ← prod стек
├── nginx.conf                       ← reverse proxy + SSE + widget.js static
├── widget/src/widget.js             ← виджет (vanilla JS)
├── backend/app/
│   ├── main.py                      ← FastAPI app, CORS
│   ├── api/v1/endpoints/
│   │   ├── clients.py               ← CRUD + index_website (умный сканер)
│   │   ├── knowledge.py             ← база знаний CRUD
│   │   ├── atlas.py                 ← Atlas SSE чат
│   │   ├── portal.py                ← Клиентский портал
│   │   ├── chat.py                  ← Виджет-чат SSE
│   │   ├── marketing.py             ← ДНК-анализ
│   │   └── dashboard.py             ← агрегированная статистика
│   └── services/
│       ├── crawler.py               ← Умный сканер (Tier1→Tier2)
│       ├── ai.py                    ← DeepSeek (stream_dialog, stream_chat)
│       ├── rag.py                   ← pgvector поиск
│       └── marketing_dna.py         ← 7 шагов ДНК
└── frontend/src/
    ├── app/                         ← Next.js роуты
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx         ← URL-based activeBlock
    │   │   ├── AIRail.tsx           ← 7 блоков, hover-popup
    │   │   ├── BlockSubNav.tsx      ← Сайдбар блока + AtlasSubNav
    │   │   └── TopNav.tsx           ← Тёмный хедер
    │   ├── clients/
    │   │   ├── ClientDetailPage.tsx ← 6 табов
    │   │   └── tabs/
    │   │       ├── MarketingTab.tsx
    │   │       ├── SettingsTab.tsx  ← embed-код виджета
    │   │       ├── LeadsTab.tsx
    │   │       ├── ConversationsTab.tsx
    │   │       └── KnowledgeTab.tsx ← с папками и качеством
    │   ├── leads/LeadsPage.tsx      ← агрегированные лиды (реальный API)
    │   ├── conversations/ConversationsPage.tsx  ← реальный API
    │   └── analytics/AnalyticsPage.tsx          ← реальный API
    └── lib/api.ts                   ← Все API вызовы
```

---

## КОНКУРЕНТЫ И UTP

| Фича | intly.ru | b24u.ru | МЫ |
|---|---|---|---|
| ДНК-анализ аудитории | ❌ | ❌ | ✅ |
| AI-оркестратор (Atlas) | ❌ | ❌ | ✅ |
| 6 AI-блоков | ❌ | ❌ | ✅ |
| Умный сканер (Tier1→Tier2) | ❌ | частично | ✅ |
| Кабинет клиента | ❌ | ✅ | ✅ |
| Kanban лидов | ✅ | ✅ | 🔴 в работе |
| Каналы (WA, VK, TG) | 38 | 5+ | Phase 2 |

**Главный UTP:** единственная платформа с 6 AI-блоками + автосканирование сайта → ДНК-анализ → готовый консультант без ручной настройки.
