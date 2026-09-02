import { test, expect } from "@playwright/test";
import {
  completeCompanyProfile,
  completeOnboarding,
  completeTalentProfile,
  gotoReady,
  sendMessage,
  signUp,
  smokeEmail,
  uniqueStamp,
  waitUntilInteractive,
  warmApp,
} from "./helpers";

test("golden path: signup through relationship stages", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(360_000);
  const stamp = uniqueStamp();
  const talentEmail = smokeEmail("talent", stamp);
  const companyEmail = smokeEmail("company", stamp);
  const talentFirst = "Smoke";
  const talentLast = `Talent${stamp}`;
  const talentName = `${talentFirst} ${talentLast}`;
  const companyName = `SmokeCo ${stamp}`;

  const companyContext = await browser.newContext();
  const talentContext = await browser.newContext();
  const companyPage = await companyContext.newPage();
  const talentPage = await talentContext.newPage();

  try {
    await test.step("warm Turbopack routes", async () => {
      await warmApp(companyPage);
      await warmApp(talentPage);
    });

    await test.step("company signs up and builds a profile", async () => {
      await signUp(companyPage, "company", companyEmail);
      await completeOnboarding(companyPage, "company");
      await completeCompanyProfile(companyPage, companyName);
      await expect(companyPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    await test.step("talent signs up, builds a profile, and discovers the company", async () => {
      await signUp(talentPage, "talent", talentEmail);
      await completeOnboarding(talentPage, "talent");
      await completeTalentProfile(talentPage, talentFirst, talentLast);
      await gotoReady(talentPage, "/discover");
      await expect(
        talentPage.getByRole("heading", { name: "Companies worth getting to know" }),
      ).toBeVisible();
      const companyCard = talentPage.locator("div").filter({ hasText: companyName }).first();
      await expect(companyCard).toBeVisible({ timeout: 20_000 });
      await companyCard.getByRole("link", { name: "View profile" }).click();
      await waitUntilInteractive(talentPage);
      await talentPage.getByRole("button", { name: "Start a connection" }).click();
      await expect(talentPage.getByRole("button", { name: "Request sent" })).toBeVisible();
    });

    await test.step("company accepts and sees the MINGLE moment", async () => {
      await gotoReady(companyPage, "/connections");
      await expect(companyPage.getByText(talentName)).toBeVisible();
      await companyPage.getByRole("button", { name: "Accept" }).click();
      await expect(
        companyPage.getByRole("heading", { name: /It.?s a mingle/i }),
      ).toBeVisible({ timeout: 15_000 });
      await companyPage.getByRole("button", { name: "Close" }).click();
      await companyPage.getByRole("link", { name: "Message" }).click();
      await waitUntilInteractive(companyPage);
      await expect(companyPage.getByPlaceholder("Write a message")).toBeVisible();
    });

    await test.step("both sides send a message", async () => {
      await sendMessage(companyPage, `Hello from the company ${stamp}`);
      const conversationUrl = companyPage.url();
      const connectionPath = new URL(conversationUrl, baseURL).pathname;

      await gotoReady(talentPage, connectionPath);
      await expect(talentPage.getByPlaceholder("Write a message")).toBeVisible();
      await sendMessage(talentPage, `Hello from talent ${stamp}`);
      await talentPage.reload({ waitUntil: "load" });
      await waitUntilInteractive(talentPage);
      await expect(talentPage.getByText("In conversation").first()).toBeVisible();
    });

    await test.step("relationship moves through Explore, Opportunity, and Decision", async () => {
      await companyPage.getByRole("link", { name: "Explore", exact: true }).click();
      await waitUntilInteractive(companyPage);
      await expect(
        companyPage.getByRole("heading", { name: "Explore the relationship" }),
      ).toBeVisible();

      await companyPage.getByRole("link", { name: "Opportunity", exact: true }).click();
      await waitUntilInteractive(companyPage);
      await companyPage.getByPlaceholder("Senior product engineer").fill("Product lead");
      await companyPage
        .getByPlaceholder("What the role involves and why you thought of them for it")
        .fill("A role that fits how they like to work.");
      await companyPage.getByRole("button", { name: "Share this opportunity" }).click();
      await expect(companyPage.getByText("Product lead")).toBeVisible();

      await companyPage.getByRole("link", { name: "Move to a decision" }).click();
      await waitUntilInteractive(companyPage);
      await companyPage.getByRole("button", { name: "Keep the relationship" }).click();
      await expect(companyPage.getByText("Keep the relationship").first()).toBeVisible();
    });

    await test.step("company board shows the candidate", async () => {
      await gotoReady(companyPage, "/board");
      await expect(companyPage.getByRole("heading", { name: "Board" })).toBeVisible();
      await expect(companyPage.getByText(talentName).first()).toBeVisible();
    });
  } finally {
    await companyContext.close().catch(() => {});
    await talentContext.close().catch(() => {});
  }
});
