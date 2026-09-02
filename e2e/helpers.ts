import { type Page, expect } from "@playwright/test";

const PASSWORD = "Playwright1";
const LONG_TEXT =
  "I care about thoughtful work, honest conversations, and building something people are proud of.";

export function uniqueStamp(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function smokeEmail(role: "talent" | "company", stamp: string): string {
  const tag = role === "talent" ? "smoketalent" : "smokecompany";
  return `yarinma13+${tag}${stamp}@gmail.com`;
}

export async function waitUntilInteractive(page: Page) {
  await page.waitForLoadState("load");
  // Turbopack/HMR can keep a socket open, so treat networkidle as best-effort.
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
}

export async function gotoReady(page: Page, url: string) {
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await waitUntilInteractive(page);
}

const WARM_ROUTES = [
  "/",
  "/auth?path=company",
  "/auth?path=talent",
  "/legal/terms",
  "/legal/privacy",
];

export async function warmApp(page: Page) {
  for (const route of WARM_ROUTES) {
    await gotoReady(page, route);
  }
}

export async function signUp(page: Page, path: "talent" | "company", email: string) {
  await gotoReady(page, `/auth?path=${path}`);
  await expect(page.getByLabel("Email")).toBeVisible({ timeout: 60_000 });
  await waitUntilInteractive(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/onboarding\//, { timeout: 60_000 });
  await waitUntilInteractive(page);
}

export async function pickAndContinue(page: Page, option: string) {
  await page.getByRole("button", { name: option, exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Saving…" })).toHaveCount(0);
}

export async function completeOnboarding(
  page: Page,
  path: "talent" | "company",
) {
  if (path === "talent") {
    await pickAndContinue(page, "Full time opportunity");
    await pickAndContinue(page, "Growth");
    await pickAndContinue(page, "Startup");
  } else {
    await pickAndContinue(page, "Hiring");
    await pickAndContinue(page, "Skills");
    await pickAndContinue(page, "Technology");
  }
  await expect(page.getByRole("heading", { name: /all set/i })).toBeVisible();
  await page.getByRole("link", { name: "Build my profile" }).click();
  await waitUntilInteractive(page);
}

export async function completeTalentProfile(
  page: Page,
  firstName: string,
  lastName: string,
) {
  await expect(
    page.getByRole("heading", { name: "Your CV tells your story" }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder("Yarin").fill(firstName);
  await page.getByPlaceholder("Cohen").fill(lastName);
  await page.getByPlaceholder("Product Manager").fill("Product Manager");
  await page.getByPlaceholder("Senior PM").fill("Senior PM");
  await page.getByPlaceholder("Technology").fill("Technology");
  await page.getByPlaceholder("Tel Aviv").fill("Tel Aviv");
  await page.getByPlaceholder("5").fill("5");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Growth", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Collaborative", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Career growth", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Beyond the CV" })).toBeVisible();
  await page.locator("textarea").fill(LONG_TEXT);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("link", { name: "Looks good" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await waitUntilInteractive(page);
}

export async function completeCompanyProfile(page: Page, companyName: string) {
  await expect(page.getByPlaceholder("Nova Labs")).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder("Nova Labs").fill(companyName);
  await page
    .getByPlaceholder("Building the tools that help teams move faster")
    .fill("Build honest career relationships");
  await page.getByPlaceholder("Technology").fill("Technology");
  await page.getByPlaceholder("Tel Aviv").fill("Tel Aviv");
  await page.locator("select").nth(0).selectOption("Seed");
  await page.locator("select").nth(1).selectOption("11 to 50");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Fast paced", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Ownership", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Product roles", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: /Who thrives here/i })).toBeVisible();
  await page.getByPlaceholder("The kind of person who does well on your team").fill(
    LONG_TEXT,
  );
  await page.locator("textarea").nth(1).fill(LONG_TEXT);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("link", { name: "Looks good" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await waitUntilInteractive(page);
}

export async function sendMessage(page: Page, body: string) {
  await page.getByPlaceholder("Write a message").fill(body);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(body).first()).toBeVisible();
}
