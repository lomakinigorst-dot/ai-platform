# AI Platform — Master Plan
> Обновлён: 2026-05-27 | Версия: 2.1
> Этот файл — главный источник правды. Читай перед каждой сессией.

---

## ПРОДУКТ

**AI SaaS платформа** для агентств (интеграторов) — добавляют клиентов, сканируют сайты, запускают AI-модули.

**Два кабинета:**
- **Кабинет агентства** (партнёра) — управляет клиентами, видит агрегированную аналитику, настраивает AI-блоки
- **Кабинет клиента** — /portal/[token] — видит только свои данные (статистика, лиды, ДНК)
  Это тот же UI, только без вкладки «Клиенты» и без агрегированных дашбордов.

**6 AI-блоков:**
1. AI-Консультант — виджет на сайт, захват лидов, RAG (основной, в работе)
2. AI-Маркетолог — ДНК-анализ аудитории, рассылки (ДНК готово, рассылки Phase 2)
3. AI-Атлас — AI-оркестратор, управляет всеми блоками (чат готов)
4. AI-HR — воронка найма (Phase 3, под замком)
5. AI-Финансы — P&L, ДДС (Phase 3, под замком)
6. AI-Юрист / AI-Продажи (Phase 4, под замком)

---

## СТЕК

```
Frontend:  Next.js (App Router) + TypeScript + Tailwind CSS + Recharts
Backend:   Python 3.12 + FastAPI + SQLAlchemy async + Alembic
DB:        PostgreSQL + pgvector (Docker)
Cache:     Redis (Docker)
AI:        DeepSeek API (чат + анализ), OpenRouter (embeddings), Firecrawl (скрапинг tier-2)
Hosting:   Timeweb Cloud VPS (AI-ATLAS, 91.186.196.137, Ubuntu 24.04, 4GB RAM)
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

### ✅ Backend (FastAPI)
- JWT авторизация (AGENT_EMAIL / AGENT_PASSWORD из .env)
- Клиенты: CRUD, умное сканирование (5-фазный crawler)
- **Умный сканер (2026-05-27):** Tier 1 (прямой httpx + sitemap.xml) → Tier 2 (Firecrawl только при 403/429/Cloudflare)
- **JSON-LD / Schema.org:** извлечение микроданных (Product, Organization, Service)
- **Оценка качества сканирования 0-100** + рекомендация глубокого сканирования
- **Папки в базе знаний:** каждый чанк классифицируется в папку (Контакты, Каталог, О компании и др.)
- RAG pipeline: pgvector embeddings через OpenRouter
- Chat SSE streaming: DeepSeek прямой API → виджет
- ДНК-анализ: 7 шагов маркетинга, автозапуск после сканирования
- База знаний, лиды, диалоги, email-уведомления о лидах
- Demo-ссылка: /api/v1/chat/demo/{domain}
- Atlas chat SSE стриминг
- Клиентский портал (токен)

### ✅ Frontend (Next.js)
- **AppShell**: AIRail (7 блоков) + BlockSubNav + TopNav
- **AtlasPage**: чат с историей, SSE, quick chips
- **Dashboard** (/): KPI-карточки, график, таблица клиентов
- **ClientsPage** (/clients): поиск, таблица с DNA-бейджами
- **ClientDetailPage** (/clients/[id]): 6 табов (Обзор, Лиды, Диалоги, База знаний, Маркетолог, Настройки)
- **KnowledgeTab**: чанки по папкам, качество 0-100, баннер глубокого сканирования
- **Портал клиента** (/portal/[token]): статистика, лиды, ДНК — без логина

### ✅ Новые поля БД (миграции применены 2026-05-27)
- `knowledge_items.folder` — папка чанка
- `clients.scan_phase` — текущая фаза сканирования
- `clients.scan_quality` — оценка качества 0-100
- `clients.needs_deep_scan` — нужно ли глубокое сканирование

### 🔑 API ключи (в .env)
- DeepSeek (sk-bdbff...) — диалоги + анализ
- OpenRouter (sk-or-v1-...) — embeddings
- Firecrawl (fc-3d18...) — tier-2 скрапинг
- Anthropic — НЕТ ключа (Claude не используется пока)

---

## ЧТО ДЕЛАЕМ СЕЙЧАС (ФАЗА 2 — Полный партнёрский кабинет)

### Структура партнёрского кабинета (цель)

**Блок «Консультант» — подменю:**
| Страница | URL | Статус |
|---|---|---|
| Дашборд | `/` | ✅ готов |
| Клиенты | `/clients` | ✅ есть, **добавить в меню** |
| Лиды (все клиенты) | `/leads` | ❌ нужно создать |
| Диалоги (все клиенты) | `/conversations` | ❌ нужно создать |
| Аналитика | `/analytics` | ❌ нужно создать |
| Настройки агентства | `/settings` | ❌ нужно создать |

**Карточка клиента `/clients/{id}` — вкладки:**
| Вкладка | Статус |
|---|---|
| Обзор | ✅ готов |
| Лиды + **Kanban воронка** | ⚠️ без Kanban |
| Диалоги | ✅ готов |
| База знаний (с папками) | ✅ готов (новый) |
| Маркетолог (ДНК) | ✅ готов |
| Настройки | ✅ готов |

**Блок «Маркетолог»:**
| Страница | URL | Статус |
|---|---|---|
| ДНК-анализ | `/marketing` | ❌ заглушка → нужна реальная страница |
| Рассылки | `/campaigns` | Phase 2 |
| Аналитика ЦА | `/audience` | Phase 2 |

### Очередь задач (в работе прямо сейчас)
1. Добавить «Клиенты» в меню Консультанта
2. Создать /leads — агрегированные лиды
3. Создать /conversations — агрегированные диалоги
4. Создать /analytics — аналитика агентства
5. Создать /settings — настройки агентства
6. Сделать /marketing рабочей (ДНК по клиентам)
7. Kanban воронка лидов в карточке клиента
8. Установить Playwright + smoke тесты

---

## ДЕПЛОЙ — Timeweb Cloud (ждём поддержку)

**Сервер:** AI-ATLAS, 91.186.196.137, Ubuntu 24.04, 4 ГБ RAM, Standard
- **Пароль root:** mdk7jgAT,SdxZ7
- **Статус:** сервер есть, интернет упал из-за неправильной настройки firewall → тикет в поддержку
- **SSH:** не работает из Claude Code окружения (таймауты) → деплой через web-консоль Timeweb

**Что готово для деплоя (в репо):**
- `frontend/Dockerfile` — multi-stage standalone Next.js
- `docker-compose.prod.yml` — prod стек
- `nginx.conf` — reverse proxy, SSE поддержка
- Код на GitHub: github.com/lomakinigorst-dot/ai-platform (ветка main)

**Команды для web-консоли Timeweb (когда поддержка починит сеть):**
```bash
apt-get update && apt-get install -y docker.io docker-compose-plugin git
git clone https://github.com/lomakinigorst-dot/ai-platform.git /app
# создать /app/.env.prod с ключами
cd /app && docker compose -f docker-compose.prod.yml up -d
```

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
├── backend/app/
│   ├── api/v1/endpoints/
│   │   ├── clients.py               ← CRUD + index_website (умный сканер)
│   │   ├── knowledge.py             ← база знаний CRUD
│   │   ├── atlas.py                 ← Atlas SSE чат
│   │   ├── portal.py                ← Клиентский портал
│   │   ├── chat.py                  ← Виджет-чат SSE
│   │   ├── marketing.py             ← ДНК-анализ
│   │   └── dashboard.py             ← Статистика
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
    │   └── clients/
    │       ├── ClientDetailPage.tsx ← 6 табов
    │       └── tabs/
    │           ├── MarketingTab.tsx
    │           ├── SettingsTab.tsx
    │           ├── LeadsTab.tsx
    │           ├── ConversationsTab.tsx
    │           └── KnowledgeTab.tsx ← с папками и качеством
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
| Kanban лидов | ✅ | ✅ | в работе |
| Каналы (WA, VK, TG) | 38 | 5+ | Phase 2 |

**Главный UTP:** единственная платформа с 6 AI-блоками + автосканирование сайта → ДНК-анализ → готовый консультант без ручной настройки.
