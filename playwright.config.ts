import { defineConfig, devices } from "@playwright/test";

import { MANATAL_MOCK_PORT } from "./e2e/support/manatal-mock";

// One fixed port for every browser-driven script (tests and scripts/browser.mjs),
// so a run never collides with `npm run dev` on 3000. Override with E2E_PORT.
const PORT = Number(process.env.E2E_PORT ?? 5000);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Stands up the stub Manatal the dev server renders from.
  globalSetup: "./e2e/support/global-setup.ts",
  globalTeardown: "./e2e/support/global-teardown.ts",
  // The apply form is long; filling it end to end is slow on WebKit in particular.
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // WebKit is the closest automatable stand-in for Safari. It is NOT Safari:
    // see e2e/README.md for what this does and does not cover.
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      // Every outbound call is stubbed in the tests, but the Supabase browser
      // client is constructed at module load and throws on undefined values.
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://e2e.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "e2e-anon-key",
      // The job and its field list are fetched server-side now, where
      // `page.route` cannot reach them, so the server is pointed at a stub.
      MANATAL_BASE_URL: `http://127.0.0.1:${MANATAL_MOCK_PORT}`,
      MANATAL_API_KEY: "e2e-key",
      MANATAL_CLIENT_SLUG: "e2e-slug",
    },
  },
});
