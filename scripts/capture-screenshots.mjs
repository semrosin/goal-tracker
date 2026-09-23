import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const output = resolve('docs/screenshots');
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:3000';
await mkdir(output, { recursive: true });

const browser = await chromium.launch();
try {
  for (const [name, viewport, isMobile] of [
    ['desktop', { width: 1440, height: 900 }, false],
    ['mobile', { width: 390, height: 844 }, true],
  ]) {
    const context = await browser.newContext({
      locale: 'ru-RU',
      viewport,
      isMobile,
      hasTouch: isMobile,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(baseUrl);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: resolve(output, `${name}-welcome.png`),
      fullPage: true,
    });

    await page.getByRole('button', { name: 'Посмотреть демо' }).click();
    await page.getByRole('heading', { name: 'Мои цели' }).waitFor();
    await page.screenshot({
      path: resolve(output, `${name}-overview.png`),
      fullPage: true,
    });

    await page
      .getByRole('link')
      .filter({ hasText: 'Финансовая подушка' })
      .click();
    await page.getByRole('heading', { name: 'План накопления' }).waitFor();
    await page.screenshot({
      path: resolve(output, `${name}-goal.png`),
      fullPage: true,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
