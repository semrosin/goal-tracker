import { expect, test } from '@playwright/test';

test('keeps goal filters when opening a goal and returning', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
    localStorage.setItem(
      'goal-tracker-demo-state',
      JSON.stringify({
        goals: [
          {
            id: 'one',
            title: 'Trip',
            description: 'Summer beach',
            currency: 'USD',
            targetAmount: 100,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'two',
            title: 'House',
            targetAmount: 100,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        transactions: [],
      })
    );
  });
  await page.goto('/app?currency=USD');
  await page.getByRole('searchbox', { name: 'Search goals' }).fill('beach');
  await expect(page.getByRole('link', { name: /Trip/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /House/ })).toHaveCount(0);
  await page.getByRole('link', { name: /Trip/ }).click();
  await page.getByRole('link', { name: 'Goals', exact: true }).click();
  await expect(
    page.getByRole('searchbox', { name: 'Search goals' })
  ).toHaveValue('beach');
  await expect(page.getByRole('combobox', { name: 'Currency' })).toHaveValue(
    'USD'
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
});
