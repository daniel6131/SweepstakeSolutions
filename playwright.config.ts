import { defineConfig, devices } from '@playwright/test';

// Dedicated port + no server reuse, so e2e always hits THIS app and never a
// stray dev server squatting :3000.
const PORT = process.env.E2E_PORT ?? '3100';
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // In CI the workflow builds and serves the app itself; locally we boot a fresh
  // dev server on the dedicated port.
  webServer: process.env.CI
    ? undefined
    : {
        command: `npm run dev -- -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
