import { expect, test } from '@playwright/test';

test('English goal uses localized months and retains dollars after reload', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
  });
  await page.goto('/app');
  await expect(page.getByRole('banner')).toHaveCount(1);
  await page.getByRole('button', { name: 'New goal' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('Dollar trip');
  await dialog.getByLabel('Amount', { exact: true }).fill('1200');
  await dialog.getByLabel('Currency').selectOption('USD');
  await expect(dialog.getByRole('option', { name: 'February' })).toHaveCount(1);
  await dialog.getByLabel('Target month').selectOption('02');
  await dialog.getByLabel('Year').fill('2027');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('link').filter({ hasText: 'Dollar trip' }).click();
  await page.getByLabel('Amount', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await expect(page.getByText('+$100', { exact: true })).toBeVisible();
  await expect(page.getByText('Target month: February 2027')).toBeVisible();
  await page.reload();
  await expect(page.getByText('+$100', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Currency')).toHaveValue('USD');
  await expect(page.getByLabel('Target month')).toHaveValue('02');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('link', { name: 'Back to goals' }).click();
  const totals = page.getByRole('article', { name: 'Total saved' });
  await expect(totals).toContainText('$100');
  await expect(totals).toContainText('₽');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false);
});
