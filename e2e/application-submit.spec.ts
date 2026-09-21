import { expect, test } from "@playwright/test";
import { applicant } from "./support/fixtures";
import { acceptConsent, fillValidApplication, gotoApplyPage, submitButton } from "./support/application-form";
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

  test("the consent statements can be ticked by clicking their text", async ({ page }) => {
    await installApiMocks(page);
    await gotoApplyPage(page);

    // Candidates click the sentence, not the 20px box. When CheckItem was
    // declared inside ConsentDeclarations it remounted on every render and this
    // click was lost, leaving Submit permanently disabled.
    await page.locator('label[for="declare-truth"] span').click();
    await expect(page.locator("#declare-truth")).toBeChecked();

    await page.locator('label[for="declare-consent"] span').click();
    await expect(page.locator("#declare-consent")).toBeChecked();

    // Submit stays gated on the rest of the schema; consent alone is not enough.
  });

  test("an incomplete application names what is missing instead of silently doing nothing", async ({ page }) => {
    const api = await installApiMocks(page);

    await gotoApplyPage(page);

    await acceptConsent(page);

    // Submission is gated on the schema alone now, so an incomplete form keeps
    // the button disabled and names what is still outstanding rather than
    // leaving the candidate with a dead button and no explanation.
    await expect(submitButton(page)).toBeDisabled();
    await expect(page.getByText("Full name is required").first()).toBeVisible();
    expect(api.submissions).toHaveLength(0);
  });
});
