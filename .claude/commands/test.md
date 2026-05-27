# /test — Запустить smoke тесты проекта

Запускает Playwright e2e тесты. Перед запуском убеждается что:
1. Docker запущен (postgres + redis)
2. Backend работает на порту 8000
3. Frontend работает на порту 3000

## Шаги

1. Проверить что backend запущен: `curl -s http://localhost:8000/api/v1/health || echo "Backend не запущен"`
2. Проверить что frontend запущен: `curl -s http://localhost:3000 | head -5`
3. Запустить тесты: `cd frontend && npx playwright test tests/e2e/smoke.spec.ts --reporter=list`
4. Если тесты провалились — показать детали падения
5. Открыть HTML отчёт если нужны скриншоты: `npx playwright show-report`

## При ошибке

Если тест "Авторизация работает" падает — проверить что backend работает и AGENT_EMAIL/AGENT_PASSWORD в .env корректны.
Если тест страницы падает — значит страница не рендерится, нужно смотреть console errors.
