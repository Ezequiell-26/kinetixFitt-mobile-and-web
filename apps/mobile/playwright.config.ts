import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E – KinetixFitt mobile (Next.js, port 3001)
 * Flujo crítico: login -> dashboard -> checkin (mock DB via route interception).
 * Ver: tests/e2e/auth.spec.ts
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      // JWT_SECRET mínimo 32 chars – el mismo usado en dev para que jose no use efímero aleatorio
      JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-kinetixfitt-32-chars!!',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/kinetix_test',
      DIRECT_URL: process.env.DIRECT_URL || 'postgresql://user:pass@localhost:5432/kinetix_test',
    },
  },
});
