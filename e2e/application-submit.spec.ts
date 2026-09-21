import { expect, test } from "@playwright/test";
import { applicant } from "./support/fixtures";
import { fillValidApplication, gotoApplyPage, submitButton } from "./support/application-form";
import { installApiMocks } from "./support/mock-api";

test.describe("job application submission", () => {
  test("a completed application reaches the API and confirms to the candidate", async ({ page }) => {
    const api = await installApiMocks(page);

    await gotoApplyPage(page);

    await fillValidApplication(page);

    await submitButton(page).click();

    // The success screen only renders after the POST resolved, so waiting on it
    // avoids racing the route handler that records the body.
    await expect(page.getByRole("heading", { name: "Application Submitted!" })).toBeVisible({
      timeout: 30_000,
    });

    // The browser actually serialized and sent the form, rather than silently
    // cancelling the submit the way Safari did before `noValidate` was added.
    expect(api.submissions).toHaveLength(1);
    expect(api.submissions[0]).toContain(applicant.fullName);
    expect(api.submissions[0]).toContain(applicant.email);
    expect(api.submissions[0]).toContain(applicant.nric);
  });

  test("an incomplete application names what is missing instead of silently doing nothing", async ({ page }) => {
    const api = await installApiMocks(page);

    await gotoApplyPage(page);

    // A step will not advance while its own fields are invalid, so the candidate
    // is never carried past a mistake and told about it pages later.
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Application Information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Family Particulars" })).toBeHidden();
    await expect(page.getByText("Full name is required").first()).toBeVisible();
    expect(api.submissions).toHaveLength(0);
  });
});
