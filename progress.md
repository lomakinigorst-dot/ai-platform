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
- [x] **Новые поля БД + миграции:**
  - `knowledge_items.folder`
  - `clients.scan_phase`, `scan_quality`, `needs_deep_scan`
- [x] KnowledgeTab: чанки по папкам, баннер качества, кнопка «Глубокое сканирование»

---

## ФАЗА 3 — Полный партнёрский кабинет ✅ ГОТОВО (2026-05-27)

### Demo data + Clients ✅
- [x] `src/lib/demo-data.ts` — 6 клиентов, 5 лидов, 5 диалогов, PARTNER_WIDGET
- [x] ClientsPage — 8 KPI карточек (b24u-стиль), таблица с health%, retention, revenue, plan badge
- [x] ClientDetailPage — Демо-чат кнопка, Активировать Trial, код виджета только после Trial

### Новые страницы ✅
- [x] `/scanner` — AI Scanner: URL инпут, batch, recent scans table с качеством
- [x] `/team` — Team page: таблица с role, last login, invite modal
- [x] `/support` — Support page: форма тикета + история
- [x] `/finance` — Finance page: партнёрский + клиентский вид

### Consultant блок ✅
- [x] `/leads` — агрегированные лиды, фильтры, обновление статусов
- [x] `/conversations` — агрегированные диалоги, 4 KPI фильтра, диалог-модал
- [x] `/analytics` — воронка, 6 KPI, бар-чарт, сентимент, источники

### Маркетолог полный редизайн ✅
- [x] ДНК-таб: EditableList (UTPs/Боли/Закрытие), сегменты, конкуренты
- [x] DnaTab: Competitor scan → UTP suggestions (Применить/Изменить/Отклонить)
- [x] DnaTab: «Усилить анализ» — multi-URL инпут, AI предлагает улучшенные УТП
- [x] DnaTab: Сохранить → диалог обновления базы знаний
- [x] MarketingTab (карточка клиента): редактируемые УТП/Боли/Закрытия + KB dialog
- [x] Кампании, Контент, Рассылки, Сегменты, AI-ген, Лог (все 7 вкладок)

### Atlas ✅
- [x] Боковая панель: 6 AI-блоков, 61 сценарий
- [x] ActionChain UI: цепочка шагов с confirm/done/pending статусами
- [x] Промо-кампания TG: action chain + подтверждение публикации

### Journey Maps ✅
- [x] /journey — карта пути Партнёра и Клиента по всем блокам

---

## ФАЗА 4 — Деплой на Timeweb Cloud ✅ ГОТОВО (2026-05-27)

- [x] Новый сервер 194.26.138.166 (старый 91.186.196.137 брошен из-за firewall)
- [x] Docker + docker-compose на сервере
- [x] 5 контейнеров: postgres, redis, backend, frontend, nginx
- [x] 5 миграций Alembic применены на проде
- [x] Исправления при деплое: Badge.tsx case, psycopg2-binary, `/api/v1` relative URL, USING::integer cast
- [x] Домен `ai.lomakin-igor.ru` настроен (DNS A → 194.26.138.166)
- [x] Вход: lomakin.igor.st@gmail.com / Atlas2026!

---

## ФАЗА 5 — Реальные данные + Widget production ✅ ГОТОВО (2026-05-27)

### Block 2 — Реальные данные вместо demo-data ✅
- [x] `api.ts`: baseURL = `/api/v1` (relative) в браузере → через nginx reverse proxy
- [x] `ClientsPage`: реальный `clientsApi.list()`, удалён импорт DEMO_CLIENTS
- [x] `LeadsPage`: реальный `dashboardApi.allLeads()` + useMutation для статусов
- [x] `ConversationsPage`: реальный `dashboardApi.allConversations()` + `dashboardApi.messages()`
- [x] `AnalyticsPage`: реальный `dashboardApi.analytics()`, KPI-сетка, бар-чарт, топ-клиенты

### Block 3 — Widget production fix ✅
- [x] `widget/src/widget.js`: default `API_BASE = 'http://ai.lomakin-igor.ru'`
- [x] `docker-compose.prod.yml`: nginx volume `./widget/src/widget.js` (было `./widget/widget.js`)
- [x] `backend/app/main.py`: CORS `allow_origin_regex=r"https?://.*"` — любые сайты клиентов
- [x] `SettingsTab.tsx`: embed-код → `http://ai.lomakin-igor.ru/widget.js`
- [x] `ClientDetailPage.tsx`: demoUrl fallback → `ai.lomakin-igor.ru`
- [x] `http://ai.lomakin-igor.ru/widget.js` → HTTP 200 ✅

### Block 4 — Atlas SSE verification ✅
- [x] Atlas `POST /api/v1/atlas/chat` через nginx стримит SSE корректно
- [x] nginx `proxy_buffering off` работает для SSE

### Block 5 — Credentials ✅
- [x] Логин изменён: lomakin.igor.st@gmail.com / Atlas2026! (в `/app/.env.prod`)
- [x] `docker compose up -d backend` — контейнер пересоздан, новые env vars загружены

---

## ФАЗА 6 — Следующие задачи (в работе)

- [ ] **Kanban лидов** — воронка в LeadsTab карточки клиента (NEW → CONTACTED → QUALIFIED → WON/LOST)
- [ ] **Telegram-интеграция** — бот как канал для консультанта
- [ ] **Страница /marketing** — реальная страница ДНК по клиентам (сейчас заглушка)
- [ ] **Тестовый клиент на проде** — создать nt-g.ru через UI, пересканировать, проверить виджет end-to-end
- [ ] **Настройки виджета** — кастомизация: цвет, аватар, позиция
- [ ] **Playwright smoke тесты** — проверка всех основных страниц

---

Последнее обновление: 2026-05-27
Текущий шаг: Фаза 6 — Kanban лидов (следующий приоритет)
