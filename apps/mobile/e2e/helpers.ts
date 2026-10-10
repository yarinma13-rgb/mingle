import { type Page, expect } from "@playwright/test";

// Mirrors e2e/helpers.ts at the repo root (web) — same backend, same
// account convention (yarinma13+<tag><stamp>@gmail.com, Yarin's own
// address via plus-addressing), same password. Selectors differ because
// react-native-web doesn't emit semantic HTML the way the Next.js app
// does: inputs are matched by accessibilityLabel (now wired in
// src/components/ui.tsx's Field → aria-label) and most buttons by
// accessibilityRole="button" (wired in ui.tsx's Button) or, for the few
// one-off Pressables that don't use the shared components, by visible
// text.

const PASSWORD = "Playwright1";
const LONG_TEXT =
  "I care about thoughtful work, honest conversations, and building something people are proud of.";

export function uniqueStamp(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function smokeEmail(role: "talent" | "company", stamp: string): string {
  const tag = role === "talent" ? "mobtalent" : "mobcompany";
  return `yarinma13+${tag}${stamp}@gmail.com`;
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
}

/** Taps a Pressable+Text element that isn't wired through the shared
 *  Button/accessibilityRole (e.g. MatchActions chips, inline links). */
export async function tapText(page: Page, text: string) {
  await page.getByText(text, { exact: true }).first().click();
}

export async function signUp(page: Page, path: "talent" | "company", email: string) {
  await gotoReady(page, "/");
  await tapText(page, "Get started");
  await tapText(page, path === "talent" ? "Talent" : "Company");
  await expect(page.getByLabel("Email")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function signIn(page: Page, email: string) {
  await gotoReady(page, "/");
  await tapText(page, "I already have an account");
  await expect(page.getByLabel("Email")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function completeTalentOnboarding(page: Page) {
  await expect(page.getByText("What are you aiming for?")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel("Career goal").fill("Lead product design at a growth-stage startup");
  await page.getByRole("button", { name: "Continue to mingle" }).click();
  await page.waitForURL(/\/\(talent\)\/dashboard|\/dashboard/, { timeout: 30_000 });
}

export async function completeCompanyOnboarding(page: Page, companyName: string) {
  await expect(page.getByText("Who are you hiring for?")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel("Company name").fill(companyName);
  await page.getByRole("button", { name: "Continue to mingle" }).click();
  await page.waitForURL(/\/\(company\)\/dashboard|\/dashboard/, { timeout: 30_000 });
}

export async function completeTalentProfile(
  page: Page,
  firstName: string,
  lastName: string,
) {
  await gotoReady(page, "/profile/build");
  await expect(page.getByText("Edit profile")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill(lastName);
  await page.getByLabel("Headline").fill("Product designer");
  await page.getByLabel("Current role").fill("Senior PM");
  await page.getByLabel("Industry").fill("Technology");
  await page.getByLabel("Location").fill("Tel Aviv");
  await page.getByLabel("Skills").fill("React, TypeScript, Figma");
  await page.getByLabel("Beyond the CV").fill(LONG_TEXT);
  await page.getByRole("button", { name: "Save profile" }).click();
}

export async function completeCompanyProfile(page: Page, companyName: string) {
  await gotoReady(page, "/company-profile/build");
  await expect(page.getByText("Edit company")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Company name").fill(companyName);
  await page.getByLabel("Industry").fill("Technology");
  await page.getByLabel("Location").fill("Tel Aviv");
  await page.getByLabel("Stage").fill("Seed");
  await page.getByLabel("Size").fill("11-50");
  await page.getByLabel("Mission").fill(LONG_TEXT);
  await page.getByLabel("What you're building").fill(LONG_TEXT);
  await page.getByLabel("Values").fill("Ownership, clarity, pace");
  await page.getByRole("button", { name: "Save company" }).click();
}

export async function sendMessage(page: Page, body: string) {
  await page.getByPlaceholder("Write a message").fill(body);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(body).first()).toBeVisible();
}
