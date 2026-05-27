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

## ФАЗА 3 — Полный партнёрский кабинет ✅ ГОТОВО (2026-05-27)

### Demo data + Clients ✅
- [x] `src/lib/demo-data.ts` — 6 клиентов, 5 лидов, 5 диалогов, 5 членов команды, 4 тикета, PARTNER_WIDGET
- [x] ClientsPage — 8 KPI карточек (b24u-стиль), таблица с health%, retention, revenue, plan badge
- [x] ClientDetailPage — Демо-чат кнопка, Активировать Trial, код виджета только после Trial

### Новые страницы ✅
- [x] `/scanner` — AI Scanner: URL инпут, batch, recent scans table с качеством
- [x] `/team` — Team page: таблица с role, last login, 4 action icons, invite modal
- [x] `/support` — Support page: форма тикета + история (мои + клиентские)
- [x] `/finance` — Finance page: партнёрский вид (KPI, расходы, клиентские выручки, транзакции) + клиентский вид (блоки, квоты, биллинг)

### Исправления Consultant блока ✅
- [x] `/leads` — только данные виджета партнёра (PARTNER_WIDGET.leads), empty state, default List, toggle Kanban
- [x] `/conversations` — только виджет партнёра, 4 KPI фильтра, поиск, диалог-модал
- [x] `/analytics` — только виджет партнёра, воронка, 6 KPI, бар-чарт, сентимент, источники

### Маркетолог полный редизайн ✅
- [x] ДНК-таб: EditableList (UTPs/Боли/Закрытие), сегменты с барами, анализ конкурентов
- [x] Диалог подтверждения регенерации + лимит 3/мес
- [x] Кампании: таблица с channel badges, статус, open rate, leads (🔒 платно)
- [x] Контент: список постов с каналами, статусами, modal генерации (🔒 платно)
- [x] Рассылки: каскад Email→TG→WA→VK с объяснением, автосеквенции + 3-шаговый wizard (🔒 платно)
- [x] Сегменты: авто-сегменты с кнопкой «Рассылка»
- [x] AI-генерация: чат-интерфейс, quick prompts, кнопка «Запланировать» (🔒 на бесплатном)
- [x] Лог действий: хронологический список AI+User событий
- [x] URL-aware вкладки — /marketing/campaigns, /marketing/content и т.д. ведут на нужный таб
- [x] Создано 6 sub-route файлов для маркетинга

### Journey Maps ✅
- [x] /journey — карта пути Партнёра и Клиента
- [x] Блоки: Консультант, Маркетолог, Atlas — по каждому пошаговый путь
- [x] Каждый шаг: описание, действия, результат (раскрывается по клику)
- [x] Переключатель Партнёр / Клиент
- [x] Journey Maps добавлен в BlockSubNav (Consultant + Atlas блоки)

### Atlas обновление ✅
- [x] Боковая панель: 6 AI-блоков с аккордеоном, 10+ сценариев в каждом (61 сценарий)
- [x] ActionChain UI: цепочка шагов с confirm/done/pending статусами
- [x] Confirm flow: кнопки «Подтвердить» / «Пропустить» перед каждым действием
- [x] Mock-ответы для ключевых сценариев с action chains

### BlockSubNav обновление ✅
- [x] Добавлены: AI Scanner (/scanner), Team (/team), Finance (/finance), Support (/support)
- [x] Маркетолог: 7 вкладок (ДНК, Кампании, Контент, Рассылки, Сегменты, AI-ген, Лог)

### Дополнения Фазы 3 ✅ (2026-05-27, продолжение)
- [x] DnaTab: Competitor scan → UTP suggestions (Применить/Изменить/Отклонить) + KB update offer
- [x] DnaTab: «Усилить анализ» — multi-URL инпут, AI предлагает улучшенные УТП с Применить/Отклонить
- [x] DnaTab: Сохранить → проверка значимости (2+ изменений) → диалог обновления базы знаний
- [x] Atlas: новый сценарий «Создать промо-кампанию для TG» с action chain + подтверждение публикации
- [x] MarketingTab (карточка клиента): редактируемые УТП/Боли/Закрытия + анализ конкурентов + KB dialog

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
