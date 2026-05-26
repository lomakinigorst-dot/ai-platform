# Progress Tracker
> Обновляется после каждой выполненной задачи
> **Цель:** рабочая система на хостинге за 2 дня (дедлайн ~2026-05-28)
> **MVP-демо:** кабинет агентства + кабинет клиента + AI Консультант + AI Маркетолог (ДНК)

---

## ФАЗА 0 — Фундамент ✅ ГОТОВО

### Шаг 1: Инфраструктура
- [x] PostgreSQL + pgvector в Docker
- [x] Redis в Docker
- [x] FastAPI backend (JWT авторизация, CRUD клиентов, RAG pipeline)
- [x] Next.js frontend (App Router, TypeScript, Tailwind, shadcn/ui, Recharts)
- [x] Widget (vanilla JS, SSE стриминг, захват лидов)

### Шаг 2: Backend-функционал
- [x] JWT авторизация (AGENT_EMAIL / AGENT_PASSWORD)
- [x] Клиенты: CRUD + Firecrawl сканирование сайтов
- [x] RAG pipeline (pgvector + OpenRouter embeddings)
- [x] Chat SSE streaming (DeepSeek прямой API)
- [x] ДНК-анализ: 7 шагов, автозапуск, результаты в marketing_data
- [x] Лиды, диалоги, дашборд, база знаний, настройки, интеграции
- [x] Demo-ссылка: /api/v1/chat/demo/{domain}

---

## ФАЗА 1 — UI Редизайн ✅ ГОТОВО (2026-05-26)

### Шаг 3: Новый AppShell
- [x] AIRail: тёмный `#1a1535`, 48px→224px, 7 AI-блоков (Atlas/Консультант/Маркетолог/HR/Финансы/Юрист/Продажи)
- [x] AIRail toggle: Zap+4px при ховере, линия `——` → стрелка `——→` (CSS shapes)
- [x] AIRail hover-popup при свёрнутом рейле (slide-out карточка)
- [x] BlockSubNav: 220px, тёмная шапка `#1a1535`, AtlasSubNav (быстрые действия), locked-блоки с CTA
- [x] TopNav: тёмный `#1a1535`, баланс ₽+дней, уведомления, Help dropdown, аккаунт
- [x] URL-based activeBlock (без useState — нет десинков)

### Шаг 4: Страницы
- [x] LoginPage: split-экран (branding + форма)
- [x] Dashboard (`/`): 7 KPI-карточек, Recharts AreaChart, таблица клиентов
- [x] ClientsPage: KPI-карточки + таблица с ДНК-бейджами
- [x] ClientDetailPage: контекстные табы
- [x] AtlasPage: чат с историей, quick chips, auto-start из ?q=, Suspense wrapper
- [x] Страницы-заглушки: /marketing, /hr, /finance, /legal, /sales, /docs, /support/*

---

## ФАЗА 2 — MVP Демо 🚀 В РАБОТЕ (дедлайн 2026-05-28)

### Шаг 5: AI Консультант — полный флоу ✅ ГОТОВО
- [x] ClientDetail → все 6 табов с реальными API (диалоги, лиды, база знаний, маркетолог, настройки, обзор)
- [x] Виджет embed-код в обзоре и настройках
- [x] Настройки ассистента: имя, режим, пол, системный промпт
- [x] Интеграции: Telegram, Bitrix24, email уведомления

### Шаг 6: AI Маркетолог — ДНК-анализ ✅ ГОТОВО
- [x] MarketingTab: 7 секций ДНК, запуск/обновление анализа, прогресс-чеклист
- [x] Backend: marketing_dna.py с 7 шагами (OpenAI-compatible DeepSeek API)

### Шаг 7: Atlas чат — реальный backend ✅ ГОТОВО
- [x] backend/atlas.py — эндпоинт /api/v1/atlas/chat (SSE стриминг)
- [x] Системный промпт: знает все 6 AI-блоков платформы
- [x] AtlasPage.tsx: заменён mock setTimeout на реальный SSE fetch стриминг
- [x] Потоковый вывод прямо в чат (обновление последнего сообщения)

### Шаг 8: Кабинет клиента ✅ ГОТОВО
- [x] backend/portal.py — эндпоинт /api/v1/portal/{token} (без логина, по токену)
- [x] /api/v1/portal/generate/{client_id} — генерация/перегенерация токена
- [x] Токен хранится в widget_settings JSON (без миграции БД)
- [x] SettingsTab → вкладка "Портал клиента": кнопка создания ссылки + копирование
- [x] /portal/[token] — отдельная страница: статистика, лиды, ДНК-анализ (без AIRail)

### Шаг 9: Деплой
- [ ] Vercel (frontend) + Railway/Render (backend + PostgreSQL)
- [ ] .env переменные в хостинге
- [ ] CORS: добавить продакшн домен
- [ ] Проверка виджета на продакшн-домене

---

## ФАЗА 3 — После демо

- [ ] Kanban лидов (drag-and-drop воронка)
- [ ] Telegram интеграция для консультанта
- [ ] Настройки виджета: аватар, цвет, позиция, триггеры
- [ ] Analytics страница (графики по блокам)
- [ ] Integrations страница (плитки каналов)
- [ ] Лендинг (публичный сайт)
- [ ] ДНК-промпты проверить (не урезаны ли)

---
Последнее обновление: 2026-05-26
Текущий шаг: Шаг 9 — Деплой на хостинг
