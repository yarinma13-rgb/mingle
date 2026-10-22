import { test, expect } from "@playwright/test";
import {
  completeCompanyOnboarding,
  completeCompanyProfile,
  completeTalentOnboarding,
  completeTalentProfile,
  gotoReady,
  sendMessage,
  signUp,
  smokeEmail,
  tapText,
  uniqueStamp,
} from "./helpers";

// Mirrors e2e/golden-path.spec.ts at the repo root (web), adapted to how
// mobile actually works today: there's no dedicated incoming-request
// Accept/Decline screen on mobile (see (company)/conversations/index.tsx,
// which only ever lists already-accepted connections) — a company
// "accepts" by marking the same candidate Interested back from
// Candidates, which sendOrAcceptConnection resolves as a mutual match.
// That's a real product gap worth a second look, not something this test
// should paper over by inventing UI that doesn't exist.
test("golden path: signup through first message", async ({ browser }) => {
  test.setTimeout(360_000);
  const stamp = uniqueStamp();
  const talentEmail = smokeEmail("talent", stamp);
  const companyEmail = smokeEmail("company", stamp);
  const talentFirst = "Mobile";
  const talentLast = `Smoke${stamp}`;
  const talentName = `${talentFirst} ${talentLast}`;
  const companyName = `MobileCo ${stamp}`;

  const companyContext = await browser.newContext();
  const talentContext = await browser.newContext();
  const companyPage = await companyContext.newPage();
  const talentPage = await talentContext.newPage();

  try {
    await test.step("company signs up and builds a profile", async () => {
      await signUp(companyPage, "company", companyEmail);
      await completeCompanyOnboarding(companyPage, companyName);
      await completeCompanyProfile(companyPage, companyName);
    });

    await test.step("talent signs up and builds a profile", async () => {
      await signUp(talentPage, "talent", talentEmail);
      await completeTalentOnboarding(talentPage);
      await completeTalentProfile(talentPage, talentFirst, talentLast);
    });

    // react-native-web nests a div per View/Text, much deeper than the
    // root web app's plain JSX — a single hasText filter matches every
    // ancestor up to the scroll container, not just the card. Requiring
    // BOTH the stamped name and the action text, then taking the
    // deepest (.last()) match, lands on the lowest common ancestor of
    // those two — exactly the one card, nothing broader.
    function cardWith(page: typeof talentPage, name: string, actionText: string) {
      return page
        .locator("div")
        .filter({ hasText: name })
        .filter({ hasText: actionText })
        .last();
    }

    await test.step("talent discovers the company and marks interested", async () => {
      await gotoReady(talentPage, "/(talent)/discover");
      const card = cardWith(talentPage, companyName, "Interested");
      await expect(card).toBeVisible({ timeout: 20_000 });
      await card.getByText("Interested", { exact: true }).click();
      await expect(card.getByText("Interested ✓")).toBeVisible();
    });

    await test.step("company marks the candidate interested back — mutual match", async () => {
      await gotoReady(companyPage, "/(company)/candidates");
      const card = cardWith(companyPage, talentName, "Interested");
      await expect(card).toBeVisible({ timeout: 20_000 });
      await card.getByText("Interested", { exact: true }).click();
      await expect(card.getByText(/It.?s a mingle/i)).toBeVisible({ timeout: 15_000 });
    });

    await test.step("company opens the conversation and sends a message", async () => {
      await gotoReady(companyPage, "/(company)/conversations");
      const row = companyPage.locator("div").filter({ hasText: talentName }).last();
      await expect(row).toBeVisible({ timeout: 20_000 });
      await row.click();
      await expect(companyPage.getByPlaceholder("Write a message")).toBeVisible({
        timeout: 20_000,
      });
      await sendMessage(companyPage, `Hello from the company ${stamp}`);
    });

    await test.step("talent sees the accepted connection and replies", async () => {
      await gotoReady(talentPage, "/(talent)/connections");
      const row = talentPage.locator("div").filter({ hasText: companyName }).last();
      await expect(row).toBeVisible({ timeout: 20_000 });
      await row.click();
      await expect(talentPage.getByPlaceholder("Write a message")).toBeVisible({
        timeout: 20_000,
      });
      await expect(talentPage.getByText(`Hello from the company ${stamp}`)).toBeVisible();
      await sendMessage(talentPage, `Hello from talent ${stamp}`);
    });

    await test.step("company moves the relationship through Explore and Opportunity", async () => {
      await tapText(companyPage, "explore");
      await expect(companyPage.getByText("Explore the relationship")).toBeVisible();

      await companyPage.goBack();
      await tapText(companyPage, "opportunity");
      await companyPage.getByLabel("Role").fill("Product lead");
      await companyPage
        .getByLabel("Context")
        .fill("A role that fits how they like to work.");
      await companyPage.getByRole("button", { name: /Share this opportunity/ }).click();
      await expect(companyPage.getByText("Product lead")).toBeVisible();
    });
  } finally {
    await companyContext.close().catch(() => {});
    await talentContext.close().catch(() => {});
  }
});
