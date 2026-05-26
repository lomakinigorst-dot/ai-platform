# AI Platform — Master Plan
> Обновлён: 2026-05-26 | Версия: 2.0
> Этот файл — главный источник правды. Читай перед каждой сессией.

---

## ПРОДУКТ

**AI SaaS платформа** для агентств (интеграторов) — добавляют клиентов, сканируют сайты, запускают AI-модули.

**Два кабинета:**
- **Кабинет агентства** — управляет клиентами, видит аналитику, настраивает AI-блоки
- **Кабинет клиента** — /portal/[token] — видит только свои данные (статистика, лиды, ДНК)

**6 AI-блоков:**
1. AI-Консультант — виджет на сайт, захват лидов, RAG (в работе, основной блок)
2. AI-Маркетолог — ДНК-анализ аудитории, рассылки (ДНК готово, рассылки Phase 2)
3. AI-Атлас — AI-оркестратор, управляет всеми блоками (чат готов)
4. AI-HR — воронка найма (Phase 2, под замком)
5. AI-Финансы — P&L, ДДС (Phase 2, под замком)
6. AI-Юрист / AI-Продажи (Phase 3, под замком)

---

## СТЕК

```
Frontend:  Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts
Backend:   Python 3.12 + FastAPI + SQLAlchemy async
DB:        PostgreSQL + pgvector (Docker)
Cache:     Redis (Docker)
AI:        DeepSeek API (чат + анализ), OpenRouter (embeddings), Firecrawl (сканирование)
Hosting:   Vercel (frontend) + Railway или Render (backend + PostgreSQL)
```

---

## ДИЗАЙН-СИСТЕМА

```
Фон приложения:  #f4f3f8
Surface (карточки): #ffffff
AIRail / TopNav:  #1a1535 (тёмно-фиолетовый)
Primary:          #6b5fd4 (фиолетовый)
Accent:           #f97316 (оранжевый)
Text:             #111827
Text muted:       #6b7280
Border:           #e5e7eb
Radius:           12px карточки, 8px кнопки
```

**Layout (AppShell):**
- AIRail слева: 48px свёрнут → 224px развёрнут, 7 AI-блоков, цвет #1a1535
- BlockSubNav: 220px, белый фон + тёмная шапка #1a1535 (совпадает с AIRail)
- TopNav: горизонтально сверху, тёмный #1a1535, баланс/уведомления/аккаунт
- Main content: светлый фон #f4f3f8

**AIRail toggle:** под Zap-иконкой линия `——` в покое → стрелка `——→` при ховере, +4px вправо

---

## ТЕКУЩЕЕ СОСТОЯНИЕ (2026-05-26) — ГОТОВО К ДЕПЛОЮ

### ✅ Backend (FastAPI)
- JWT авторизация (AGENT_EMAIL / AGENT_PASSWORD из .env)
- Клиенты: CRUD, Firecrawl сканирование сайтов, статус indexing/active
- RAG pipeline: pgvector embeddings через OpenRouter (text-embedding-3-small)
- Chat SSE streaming: DeepSeek прямой API → виджет на сайт
- ДНК-анализ: 7 шагов маркетинга, автозапуск после сканирования, результаты в marketing_data JSON
- База знаний, лиды (CRUD + статусы), диалоги, email-уведомления о лидах
- Demo-ссылка: GET /api/v1/chat/demo/{domain} → инжектирует виджет в реальный сайт
- **Atlas chat**: POST /api/v1/atlas/chat — SSE стриминг, системный промпт о всех блоках
- **Клиентский портал**: POST /api/v1/portal/generate/{id} + GET /api/v1/portal/{token}
- Dashboard stats, client stats эндпоинты

### ✅ Frontend (Next.js)
- **AppShell**: AIRail (7 блоков, hover-popup, collapse/expand) + BlockSubNav + TopNav
- **AtlasPage**: чат с историей, SSE стриминг DeepSeek, quick chips, auto-start из ?q=
- **Dashboard** (/): 7 KPI-карточек, Recharts AreaChart, таблица клиентов
- **ClientsPage** (/clients): поиск, KPI, таблица с DNA-бейджами
- **ClientDetailPage** (/clients/[id]): 6 табов:
  - Обзор: KPI-статс, embed-код виджета
  - Лиды: таблица с фильтрами, изменение статуса
  - Диалоги: список + раскрытие переписки
  - База знаний: просмотр, редактирование чанков
  - Маркетолог: 7 секций ДНК, запуск/обновление
  - Настройки: ассистент, виджет embed, интеграции, **портал клиента**
- **Портал клиента** (/portal/[token]): статистика, лиды, ДНК — без логина, по ссылке
- **Страницы AI-блоков**: /atlas ✅, /marketing, /hr, /finance, /legal, /sales (заглушки)

### ✅ Widget (vanilla JS)
- Плавающая кнопка, SSE стриминг, захват лидов

### 🔑 API ключи (в .env)
- DeepSeek API (sk-bdbff...) — диалоги + анализ
- OpenRouter (sk-or-v1-...) — embeddings
- Firecrawl (fc-3d18...) — сканирование
- Anthropic — НЕТ ключа (Claude не используется пока)

---

## ЧТО ОСТАЛОСЬ ДО ДЕМО (Шаг 9)

### Деплой — Яндекс Облако (выбрано для российской аудитории)

**Архитектура:**
- Compute Cloud VM (2 vCPU, 4GB RAM) — backend + frontend + nginx
- Managed PostgreSQL (1 хост) — с pgvector для RAG
- Managed Redis (1 хост) — очередь задач ДНК-анализа
- Object Storage — widget.js статика

**Цена: ~7 750 ₽/мес. Грант Boost Start = 50 000 ₽ на 6 мес → всё покрыто.**
Грант: yandex.cloud/ru/grants → Boost → Start (для стартапов с MVP)

**Что сделано (готово к деплою):**
- Dockerfile с CMD для backend
- CORS настроен (BASE_DOMAIN из .env)
- Код на GitHub: github.com/lomakinigorst-dot/ai-platform (ветка main)

**Что нужно от Игоря:**
1. Зарегистрироваться на yandex.cloud/ru
2. Подать заявку на грант
3. Создать сервисный аккаунт → роль editor → дать API-ключ
4. Я сам через yc CLI создаю всю инфраструктуру и деплою

### После деплоя — приоритет 1
- Kanban лидов (drag-and-drop воронка)
- Telegram интеграция для консультанта (Telegram Chat ID уже есть в настройках)
- Страница /marketing: запуск ДНК прямо из блока Маркетолог (сейчас ДНК только в ClientDetail)

---

## ФАЗЫ ПОСЛЕ ДЕПЛОЯ

### ФАЗА 2 — Расширение каналов
- WhatsApp (Wazzup API), VK, Авито
- AmoCRM, Битрикс24 полная интеграция
- Kanban лидов
- Analytics страница (графики по блокам)

### ФАЗА 3 — Новые AI-блоки
- AI-HR (воронка найма, HH.ru)
- AI-Финансы (подключение банков)
- Финансовый модуль агентства (доход партнёра, рефералы)

### ФАЗА 4 — Платформа
- Лендинг (публичный сайт)
- Биллинг и тарифы
- Мобильная PWA версия

---

## ПРАВИЛА РАЗРАБОТКИ

### Не делать никогда
- Не показывать названия AI-моделей пользователю
- Не делать сложный онбординг
- Не давать оператору вклиниться в диалог
- Не делать Kanban до CRM интеграции (договорились)
- Не добавлять фичи не из плана без обсуждения

### Архитектура
- Next.js App Router (НЕ Pages Router)
- API вызовы только через `src/lib/api.ts`
- CSS переменные в globals.css — не хардкодить цвета где можно избежать
- URL-derived activeBlock в AppShell (нет useState для activeBlock — баг был)
- Токен портала хранить в `widget_settings` JSON (нет Alembic миграций для простых полей)

---

## ЗАПУСК ДЛЯ РАЗРАБОТКИ

```bash
# Backend
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000 --env-file ../.env

# Frontend
cd frontend && npm run dev

# Docker (PostgreSQL + Redis)
docker-compose up -d
```

---

## КЛЮЧЕВЫЕ ФАЙЛЫ

```
ai-platform/
├── PLAN.md                          ← этот файл (главный источник правды)
├── progress.md                      ← детальный чеклист по шагам
├── .env                             ← API ключи (не коммитить!)
├── backend/app/
│   ├── main.py                      ← регистрация роутеров
│   ├── api/v1/endpoints/
│   │   ├── atlas.py                 ← Atlas SSE чат
│   │   ├── portal.py                ← Клиентский портал (токен)
│   │   ├── chat.py                  ← Виджет-чат SSE
│   │   ├── marketing.py             ← ДНК-анализ
│   │   └── dashboard.py             ← Статистика
│   ├── services/
│   │   ├── ai.py                    ← DeepSeek (stream_dialog, stream_chat, stream_analysis)
│   │   ├── rag.py                   ← pgvector поиск
│   │   └── marketing_dna.py         ← 7 шагов ДНК
│   └── models/client.py             ← Client модель (portal_token в widget_settings JSON)
└── frontend/src/
    ├── app/                         ← Next.js роуты
    │   ├── portal/[token]/page.tsx  ← Кабинет клиента
    │   └── atlas/page.tsx           ← Atlas чат
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx         ← URL-based activeBlock (не useState!)
    │   │   ├── AIRail.tsx           ← 7 блоков, hover-popup, CSS стрелка
    │   │   ├── BlockSubNav.tsx      ← Сайдбар блока + AtlasSubNav
    │   │   └── TopNav.tsx           ← Тёмный хедер
    │   ├── atlas/AtlasPage.tsx      ← Чат с SSE стримингом DeepSeek
    │   ├── clients/
    │   │   ├── ClientDetailPage.tsx ← 6 табов
    │   │   └── tabs/
    │   │       ├── MarketingTab.tsx ← ДНК 7 секций
    │   │       ├── SettingsTab.tsx  ← + вкладка "Портал клиента"
    │   │       ├── LeadsTab.tsx
    │   │       ├── ConversationsTab.tsx
    │   │       └── KnowledgeTab.tsx
    │   └── portal/ClientPortalPage.tsx ← Портал без AIRail
    └── lib/api.ts                   ← Все API вызовы (portalApi, clientsApi, etc.)
```

---

## КОНКУРЕНТЫ И UTP

| Фича | intly.ru | b24u.ru | МЫ |
|---|---|---|---|
| ДНК-анализ аудитории | ❌ | ❌ | ✅ |
| AI-оркестратор (Atlas) | ❌ | ❌ | ✅ |
| 6 AI-блоков | ❌ | ❌ | ✅ |
| Кабинет клиента | ❌ | ✅ | ✅ |
| Автосканирование → ДНК → консультант | ❌ | ❌ | ✅ |
| Kanban лидов | ✅ | ✅ | Phase 2 |
| Каналы (WA, VK, TG) | 38 | 5+ | Phase 2 |

**Главный UTP:** единственная платформа где сканирование сайта автоматически → ДНК-анализ → готовый AI-консультант без ручной настройки.
