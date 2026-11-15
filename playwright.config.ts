import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: join(tmpdir(), 'goal-tracker-playwright'),
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    locale: 'ru-RU',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm start -- --port 3100 --no-open',
    env: { SUPABASE_URL: '', SUPABASE_PUBLISHABLE_KEY: '' },
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
