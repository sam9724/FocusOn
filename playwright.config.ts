import { defineConfig } from "@playwright/test";
export default defineConfig({
  timeout: 120_000,
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:4173${process.env.E2E_BASE_PATH || "/"}`,
    launchOptions: process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: `http://127.0.0.1:4173${process.env.E2E_BASE_PATH || "/"}`,
    reuseExistingServer: !process.env.CI,
  },
});
