import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'admin@localhost';
const PASS  = 'changeme';

async function login(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => void ? P : never) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`);
}

test.describe('Smoke тесты — партнёрский кабинет', () => {

  test('Страница логина открывается', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Авторизация работает', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(`${BASE}/`);
    // Dashboard должен показать хотя бы заголовок
    await expect(page.locator('text=Доброе')).toBeVisible({ timeout: 10_000 });
  });

  test('Список клиентов открывается', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/clients`);
    // Страница должна загрузиться без ошибок
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });

  test('Вкладка Лиды открывается', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/leads`);
    await expect(page.locator('h1')).toContainText('Лиды', { timeout: 10_000 });
  });

  test('Вкладка Диалоги открывается', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/conversations`);
    await expect(page.locator('h1')).toContainText('Диалоги', { timeout: 10_000 });
  });

  test('Аналитика открывается', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/analytics`);
    await expect(page.locator('h1')).toContainText('Аналитика', { timeout: 10_000 });
  });

  test('Настройки агентства открываются', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/settings`);
    await expect(page.locator('h1')).toContainText('Настройки', { timeout: 10_000 });
  });

  test('Маркетолог открывается', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/marketing`);
    await expect(page.locator('h1')).toContainText('Маркетолог', { timeout: 10_000 });
  });

  test('Atlas чат открывается', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/atlas`);
    await expect(page.locator('text=Atlas')).toBeVisible({ timeout: 10_000 });
  });

  test('Карточка клиента nt-g.ru открывается', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/clients`);
    // Если есть nt-g.ru клиент — кликаем на него
    const clientLink = page.locator('text=nt-g.ru').first();
    const exists = await clientLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (exists) {
      await clientLink.click();
      await expect(page.locator('text=База знаний')).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip(true, 'Клиент nt-g.ru не найден');
    }
  });

});
