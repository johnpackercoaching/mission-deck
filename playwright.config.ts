import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  projects: [
    {
      name: 'authenticated',
      testMatch: /authenticated\.spec\.ts/,
    },
    {
      name: 'unauthenticated',
      testMatch: /mission-deck\.spec\.ts/,
    },
  ],
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 5174,
    reuseExistingServer: true,
    timeout: 30000,
  },
})
