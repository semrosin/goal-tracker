import { expect, test } from '@playwright/test';

test('visitor can open a useful demo and add a deposit', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Копите на важное с понятным планом' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Посмотреть демо' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Мои цели' })).toBeVisible();

  await page.getByRole('button', { name: 'Новая цель' }).click();
  const dialog = page.getByRole('dialog', { name: 'Новая цель' });
  await dialog.getByRole('textbox', { name: 'Название' }).fill('E2E поездка');
  await dialog.getByRole('textbox', { name: 'Сумма' }).fill('150000');
  await dialog.getByRole('button', { name: 'Создать' }).click();

  await page.getByRole('link').filter({ hasText: 'E2E поездка' }).click();
  await page.getByRole('textbox', { name: 'Сумма' }).fill('1000');
  await page.getByRole('button', { name: 'Добавить операцию' }).click();
  await expect(page.getByText('+1 000 ₽')).toBeVisible();
});

test('demo enforces withdrawal and history rules in the browser', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Посмотреть демо' }).click();
  await page.getByRole('button', { name: 'Новая цель' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Новая цель' });
  await createDialog
    .getByRole('textbox', { name: 'Название' })
    .fill('Проверка журнала');
  await createDialog.getByRole('textbox', { name: 'Сумма' }).fill('1000');
  await createDialog.getByRole('button', { name: 'Создать' }).click();
  await page.getByRole('link').filter({ hasText: 'Проверка журнала' }).click();

  const amount = page.getByRole('textbox', { name: 'Сумма' });
  await amount.fill('500');
  await page.getByRole('button', { name: 'Добавить операцию' }).click();
  await page.getByRole('button', { name: 'Снять' }).click();
  await amount.fill('600');
  await page.getByRole('button', { name: 'Добавить операцию' }).click();
  await expect(
    page.getByText('Нельзя снять больше, чем накоплено')
  ).toBeVisible();

  await amount.fill('300');
  await page.getByRole('button', { name: 'Добавить операцию' }).click();
  await expect(page.getByText('-300 ₽')).toBeVisible();

  await page.getByRole('button', { name: /Удалить пополнение \+500/ }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Удалить операцию' });
  await deleteDialog.getByRole('button', { name: 'Удалить' }).click();
  await expect(deleteDialog.getByRole('alert')).toBeVisible();
  await deleteDialog.getByRole('button', { name: 'Отмена' }).click();
  await page.getByRole('button', { name: /Удалить снятие -300/ }).click();
  await page
    .getByRole('dialog', { name: 'Удалить операцию' })
    .getByRole('button', { name: 'Удалить' })
    .click();
  await expect(page.getByText('-300 ₽')).toHaveCount(0);
});

test('visitor can choose English before entering the app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Save for what matters with a clear plan',
    })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.getByRole('heading', { name: 'My goals' })).toBeVisible();
  await page.getByRole('link').filter({ hasText: 'Emergency fund' }).click();
  await expect(
    page.getByRole('heading', { name: 'Savings plan' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Transaction history' })
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false);
});

test('English sign-in screen has translated form labels', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
});

test('sign-in offers email and password with an explicit unavailable state', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(
    page.getByRole('textbox', { name: 'Электронная почта' })
  ).toBeVisible();
  await expect(page.getByLabel('Пароль')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeDisabled();
});

test('first screen and demo fit a mobile viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasOverflow).toBe(false);

  await page.getByRole('button', { name: 'Посмотреть демо' }).click();
  await expect(page.getByRole('heading', { name: 'Мои цели' })).toBeVisible();
  const appHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(appHasOverflow).toBe(false);
  await page
    .getByRole('link')
    .filter({ hasText: 'Финансовая подушка' })
    .click();
  const detailHasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(detailHasOverflow).toBe(false);
});

test('goal dialog restores keyboard focus after Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Посмотреть демо' }).click();
  const opener = page.getByRole('button', { name: 'Новая цель' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Новая цель' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Закрыть' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
