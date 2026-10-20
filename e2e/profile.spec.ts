import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

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
    .getByRole('banner')
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
    page.getByRole('heading', { name: 'Profile', exact: true })
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
    page.getByRole('heading', { name: 'Профиль', exact: true })
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
  await page.getByRole('link', { name: 'К списку целей' }).click();
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
