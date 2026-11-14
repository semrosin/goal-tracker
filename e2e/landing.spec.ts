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

test('the first screen reaches the bottom of the viewport', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).click();
  const section = page.getByRole('heading', {
    name: 'Everything for your savings',
  });
  const top = await section.evaluate(
    (heading) => heading.getBoundingClientRect().top
  );
  expect(top).toBeGreaterThanOrEqual(
    await page.evaluate(() => window.innerHeight)
  );
});

test('landing actions have equal heights', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).click();
  const signUp = await page
    .getByRole('button', { name: 'Create account' })
    .first()
    .boundingBox();
  const signIn = await page
    .getByRole('button', { name: 'Sign in' })
    .first()
    .boundingBox();
  expect(signUp).not.toBeNull();
  expect(signIn).not.toBeNull();
  expect(signIn!.height).toBeCloseTo(signUp!.height, 1);
});

test('public headers and language controls stay consistent across pages', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('goal-tracker-locale', 'en');
    localStorage.setItem('goal-tracker-mode', 'demo');
  });
  await page.goto('/');
  const header = page.getByRole('banner');
  const landingHeader = await header.boundingBox();
  const landingSwitch = await page
    .getByRole('group', { name: 'Language' })
    .boundingBox();
  await page.goto('/auth/sign-in');
  const authHeader = await page.getByRole('banner').boundingBox();
  const authSwitch = await page
    .getByRole('group', { name: 'Language' })
    .boundingBox();
  expect(authHeader?.height).toBe(landingHeader?.height);
  expect(authSwitch?.height).toBe(landingSwitch?.height);
  expect(authSwitch?.width).toBe(landingSwitch?.width);
  await page.goto('/profile');
  const profileSwitch = await page
    .getByRole('group', { name: 'Language' })
    .boundingBox();
  expect(profileSwitch?.height).toBe(landingSwitch?.height);
  expect(profileSwitch?.width).toBe(landingSwitch?.width);
});

test('public layout stays aligned when navigating to sign in and sign up', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN' }).click();
  const geometry = async () =>
    page.evaluate(() => {
      const header = document.querySelector('header')!;
      const brand = header.querySelector('a')!;
      const shell = header.parentElement!;
      const backdrop = shell.firstElementChild!;
      const leftRail = getComputedStyle(backdrop, '::before');
      const rightRail = getComputedStyle(backdrop, '::after');
      const box = brand.getBoundingClientRect();
      return {
        width: document.documentElement.clientWidth,
        x: box.x,
        right: box.right,
        railLeft: leftRail.left,
        railRight: rightRail.right,
      };
    });
  await expect(page.locator('html')).toHaveCSS('scrollbar-gutter', 'stable');
  const landing = await geometry();
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  expect(await geometry()).toEqual(landing);
  await page.getByRole('link', { name: 'Create account' }).click();
  expect(await geometry()).toEqual(landing);
});
