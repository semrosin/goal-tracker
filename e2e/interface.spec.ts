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
  await page.getByRole('link', { name: 'Goals', exact: true }).click();
  const totals = page.getByRole('article', { name: 'Total saved' });
  await expect(totals).toContainText('$100');
  await expect(totals).toContainText('₽');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false);
});

test('centers header navigation and keeps controls separate at each viewport', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
  });
  await page.goto('/app');
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const header = await page.getByRole('banner').boundingBox();
    const navigation = await page
      .getByRole('navigation', { name: 'Goals' })
      .boundingBox();
    expect(header).not.toBeNull();
    expect(navigation).not.toBeNull();
    expect(
      Math.abs(
        navigation!.x + navigation!.width / 2 - (header!.x + header!.width / 2)
      )
    ).toBeLessThan(2);
    const controls = await page.getByRole('banner').locator('a, button').all();
    const boxes = await Promise.all(
      controls.map((control) => control.boundingBox())
    );
    const sorted = boxes
      .filter((box) => box !== null)
      .sort((a, b) => a.x - b.x);
    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index - 1].x + sorted[index - 1].width).toBeLessThanOrEqual(
        sorted[index].x
      );
    }
  }
});

test('shows the goals underline on hover and preserves profile navigation', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Hover requires a pointer');
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-mode', 'demo');
    localStorage.setItem('goal-tracker-locale', 'en');
  });
  await page.goto('/profile');
  const profile = page.getByRole('link', { name: 'Profile' });
  const goals = page.getByRole('link', { name: 'Goals', exact: true });
  await expect(profile).toHaveAttribute('aria-current', 'page');
  await expect(goals).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)');
  await goals.hover();
  await expect(goals).toHaveCSS('border-bottom-color', 'rgb(137, 150, 237)');
  await goals.click();
  await expect(goals).toHaveAttribute('aria-current', 'page');
  await expect(profile).not.toHaveAttribute('aria-current', 'page');
});
