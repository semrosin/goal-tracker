import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test('uses one profile typeface and a compact highlighted language switch', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
  });
  await page.goto('/profile');
  const heading = page.getByRole('heading', { name: 'Your statistics' });
  const amount = page
    .getByRole('article', { name: 'Total saved' })
    .locator('strong');
  await expect(heading).toHaveCSS('font-family', /Finlandica Text/);
  await expect(amount).toHaveCSS('font-family', /Finlandica Text/);
  const language = page.getByRole('group', { name: 'Language' });
  await expect(language.getByRole('button', { name: 'EN' })).toHaveCSS(
    'background-color',
    'rgb(198, 168, 237)'
  );
  await language.getByRole('button', { name: 'RU' }).click();
  await expect(page.getByRole('button', { name: 'RU' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('places goal amounts above the bar and the percentage beside it', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
  });
  await page.goto('/profile');
  const progress = page.getByRole('progressbar').first();
  const row = progress.locator('..');
  const percent = row.locator('strong');
  const item = row.locator('..');
  const heading = item.locator('div').first();
  await expect(heading.locator('a')).toBeVisible();
  await expect(heading.locator('span')).toContainText('/');
  const barBox = await progress.boundingBox();
  const percentBox = await percent.boundingBox();
  const headingBox = await heading.boundingBox();
  expect(barBox).not.toBeNull();
  expect(percentBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(headingBox!.y + headingBox!.height).toBeLessThan(barBox!.y);
  expect(percentBox!.x).toBeGreaterThanOrEqual(barBox!.x + barBox!.width);
});

test('keeps a typical saved amount on one line on a narrow phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'ru');
  });
  await page.goto('/profile');
  await expect(page.locator('html')).toHaveCSS('scrollbar-gutter', 'auto');
  await page.evaluate(() => document.fonts.ready);
  const value = page
    .getByRole('article', { name: 'Всего накоплено' })
    .locator('strong');
  await expect(value).toBeVisible();
  const lineCount = await value.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getClientRects().length;
  });
  expect(lineCount).toBe(1);
});

test('keeps profile metrics in a shared row above account settings on desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile');
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
  });
  await page.goto('/profile');
  const first = await page
    .getByRole('article', { name: 'Total saved' })
    .boundingBox();
  const last = await page
    .getByRole('article', { name: 'Transactions' })
    .boundingBox();
  const account = await page
    .getByRole('complementary', { name: 'Account details' })
    .boundingBox();
  expect(first).not.toBeNull();
  expect(last).not.toBeNull();
  expect(account).not.toBeNull();
  expect(Math.abs(first!.y - last!.y)).toBeLessThan(1);
  expect(last!.x + last!.width).toBeCloseTo(account!.x + account!.width, 0);
  expect(last!.y + last!.height).toBeLessThanOrEqual(account!.y);
});

test('profile inherits the landing language and preserves changes after reload', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.location().url.startsWith('https://fonts.googleapis.com/')
    )
      errors.push(message.text());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).click();
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Sign in', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Sign in', exact: true })
  ).toBeVisible();
  // Use the isolated local ledger; no real credentials or account writes.
  await page.evaluate(() => localStorage.setItem('goal-tracker-mode', 'demo'));
  await page.goto('/app');
  await expect(page.getByRole('button', { name: 'EN' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator('webpack-dev-server-client-overlay')).toHaveCount(
    0
  );
  await expect(page).toHaveTitle('GoalCraft — savings goals');
  await expect(
    page.getByRole('heading', { name: 'Your statistics', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'EN' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(
    page.getByRole('img', { name: 'Savings over time' })
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Deposits and withdrawals' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'RU' }).click();
  await expect(
    page.getByRole('heading', { name: 'Ваша статистика', exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'RU' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByText('Данные графиков', { exact: true }).click();
  await expect(
    page.getByRole('table', { name: 'Данные графиков' })
  ).toBeVisible();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(7);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: join(tmpdir(), `goalcraft-profile-${testInfo.project.name}.png`),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Цели', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Мои цели' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('profile separates ruble and dollar figures and shows goal progress', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'ru');
    localStorage.setItem(
      'goal-tracker-demo-state',
      JSON.stringify({
        goals: [
          {
            id: 'rub',
            title: 'Подушка',
            targetAmount: 1000,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'usd',
            title: 'Поездка',
            targetAmount: 500,
            currency: 'USD',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        transactions: [
          {
            id: 't1',
            goalId: 'rub',
            type: 'deposit',
            amount: 1000,
            createdAt: '2026-01-01T01:00:00.000Z',
          },
          {
            id: 't2',
            goalId: 'usd',
            type: 'deposit',
            amount: 50,
            createdAt: '2026-01-01T02:00:00.000Z',
          },
        ],
      })
    );
  });
  await page.goto('/profile');
  const total = page.getByRole('article', { name: 'Всего накоплено' });
  await expect(total).toContainText('1 000 ₽');
  await expect(
    page.getByRole('progressbar', { name: 'Прогресс цели Подушка' })
  ).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'USD' }).click();
  await expect(total).toContainText('50 $');
  await expect(
    page.getByRole('progressbar', { name: 'Прогресс цели Поездка' })
  ).toHaveAttribute('aria-valuenow', '10');
  await page.getByRole('link', { name: 'Поездка', exact: true }).click();
  await page.getByLabel('Сумма', { exact: true }).fill('25');
  await page.getByRole('button', { name: 'Добавить операцию' }).click();
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await page.getByRole('button', { name: 'USD' }).click();
  await expect(total).toContainText('75 $');
  await expect(
    page.getByRole('progressbar', { name: 'Прогресс цели Поездка' })
  ).toHaveAttribute('aria-valuenow', '15');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false);
});

test('empty profile explains how to start and keeps settings available', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'ru');
    localStorage.setItem(
      'goal-tracker-demo-state',
      JSON.stringify({ goals: [], transactions: [] })
    );
  });
  await page.goto('/profile');
  await expect(
    page.getByRole('heading', { name: 'Здесь появится ваша статистика' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'EN' })).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Динамика накоплений' })
  ).toHaveCount(0);
});
