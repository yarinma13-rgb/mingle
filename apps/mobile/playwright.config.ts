import { defineConfig, devices } from "@playwright/test";

// Scoped to apps/mobile — separate from the root Next.js e2e suite.
// Exercises the Expo web build (same screens as native, via react-native-web)
// since that's what a headless browser can actually drive.
const port = Number(process.env.PLAYWRIGHT_PORT ?? 8081);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 360_000,
  expect: { timeout: 20_000 },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx expo start --web --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
