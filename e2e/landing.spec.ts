import { expect, test } from '@playwright/test';

test('landing explains the service and opens the sign-up form', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Копите на важное с понятным планом' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Посмотреть демо' })
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Всё для ваших накоплений' })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Как начать' })).toBeVisible();

  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await expect(page).toHaveURL(/\/auth\/sign-up$/);
  await expect(
    page.getByRole('heading', { name: 'Создать аккаунт' })
  ).toBeVisible();
});

test('landing switches to English', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Save for what matters with a clear plan',
    })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Everything for your savings' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sign in' }).first().click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
});

test('sign-in offers email and password with an explicit unavailable state', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).first().click();

  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(
    page.getByRole('textbox', { name: 'Электронная почта' })
  ).toBeVisible();
  await expect(page.getByLabel('Пароль')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeDisabled();
});

test('landing fits a mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasOverflow).toBe(false);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const bottomOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(bottomOverflow).toBe(false);
});
