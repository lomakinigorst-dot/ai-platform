# Деплой на продакшн

## Шаг 1 — Backend на Railway

1. Зайди на railway.app → New Project → Deploy from GitHub
2. Выбери репозиторий, укажи root directory: `backend`
3. В Railway Settings → Variables добавь:

```
DATABASE_URL=postgresql+asyncpg://...  (Railway даст автоматически если добавить PostgreSQL)
REDIS_URL=redis://...                  (Railway даст если добавить Redis)
DEEPSEEK_API_KEY=sk-bdbff...
OPENROUTER_API_KEY=sk-or-v1-...      (для embeddings)
FIRECRAWL_API_KEY=fc-3d18...
SECRET_KEY=сгенерируй-случайную-строку-32-символа
AGENT_EMAIL=твой@email.com
AGENT_PASSWORD=твой-пароль
ENVIRONMENT=production
BASE_DOMAIN=твой-домен.vercel.app    (после деплоя фронтенда)
```

4. Railway автоматически добавит PostgreSQL — скопируй DATABASE_URL
5. Проверь: `https://твой-backend.railway.app/api/health` → должно вернуть `{"status":"ok"}`

---

## Шаг 2 — Frontend на Vercel

1. Зайди на vercel.com → New Project → Import from GitHub
2. Root directory: `frontend`
3. В Vercel Settings → Environment Variables добавь:

```
NEXT_PUBLIC_API_URL=https://твой-backend.railway.app/api/v1
```

4. Deploy → получи URL типа `https://ai-platform-xxx.vercel.app`
5. Вернись в Railway → обнови `BASE_DOMAIN=ai-platform-xxx.vercel.app`

---

## Шаг 3 — Проверить

- [ ] Открыть фронтенд → войти (AGENT_EMAIL / AGENT_PASSWORD)
- [ ] Создать тестового клиента
- [ ] Запустить сканирование сайта
- [ ] Проверить ДНК-анализ (вкладка Маркетолог в ClientDetail)
- [ ] Открыть демо-ссылку клиента → виджет должен работать
- [ ] Протестировать Atlas чат
- [ ] Создать портал клиента (Settings → Портал клиента) → открыть ссылку

---

## Alembic миграции (если нужно обновить БД)

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

На Railway миграции можно запускать через Railway CLI:
```bash
railway run alembic upgrade head
```
