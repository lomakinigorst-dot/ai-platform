const { chromium } = require('@playwright/test');

(async () => {
  const BASE = 'http://localhost:3000';
  const PAGES = [
    '/', '/login', '/clients', '/scanner', '/team', '/support', '/finance',
    '/marketing', '/marketing/campaigns', '/marketing/content',
    '/marketing/broadcasts', '/marketing/segments', '/marketing/ai',
    '/atlas', '/leads', '/conversations', '/analytics', '/journey',
    '/hr', '/legal', '/sales', '/referral',
  ];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push({ url: page.url(), text: msg.text().slice(0, 150) });
  });
  page.on('pageerror', err => pageErrors.push({ url: page.url(), text: err.message.slice(0, 150) }));

  const results = [];
  for (const path of PAGES) {
    try {
      const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(600);
      const status = res?.status() ?? 0;
      const title = await page.title();
      results.push({ path, status, title: title.slice(0, 50), ok: status < 400 });
    } catch (e) {
      results.push({ path, status: 'ERR', title: e.message.slice(0, 80), ok: false });
    }
  }

  await browser.close();

  console.log('\n=== РЕЗУЛЬТАТЫ ПРОВЕРКИ СТРАНИЦ ===\n');
  let hasIssues = false;
  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    if (!r.ok) hasIssues = true;
    console.log(`${icon} ${String(r.status).padEnd(4)} ${r.path.padEnd(38)} ${r.title}`);
  }

  const allErrors = [...consoleErrors, ...pageErrors];
  if (allErrors.length) {
    hasIssues = true;
    console.log('\n=== ОШИБКИ В КОНСОЛИ ===');
    const unique = [...new Set(allErrors.map(e => `[${e.url.replace(BASE,'')}] ${e.text}`))];
    unique.slice(0, 20).forEach(e => console.log('  ' + e));
  } else {
    console.log('\n✅ Консольных ошибок не обнаружено');
  }

  console.log(hasIssues ? '\n⚠️  Найдены проблемы, требующие исправления' : '\n✅ Все страницы в порядке');
})();
