import { defineConfig, devices } from '@playwright/test'

const port = 3456

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /public\.spec/ },
  ],
  webServer: {
    // Build de production servi avec une base vierge et la boîte d'envoi de test
    command: `rm -rf .data/e2e && mkdir -p .data/e2e && node .output/server/index.mjs`,
    port,
    reuseExistingServer: false,
    env: {
      PORT: String(port),
      NUXT_DB_URL: 'file:.data/e2e/sestini.db',
      NUXT_SESSION_PASSWORD: 'e2e-session-password-at-least-32-characters',
      NUXT_E2E_OUTBOX: '1',
    },
  },
})
