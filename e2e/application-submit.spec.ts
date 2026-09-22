import { expect, test } from "@playwright/test";
import { applicant } from "./support/fixtures";
import { fillText, fillValidApplication, gotoApplyPage, submitButton } from "./support/application-form";
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

  test("a failed step sends the candidate to the field that needs fixing", async ({ page }) => {
    await installApiMocks(page);
    await gotoApplyPage(page);

    // Fill everything on step 1 except one field in the middle of the step, so
    // a scroll to the top of the form would clearly be the wrong answer.
    await fillText(page, "expected_salary", "6500");
    await fillText(page, "years_of_experience", "5");
    await fillText(page, "full_name", "Alex Tan");

    await page.getByRole("button", { name: "Continue" }).click();

    const firstInvalid = page.locator("#field-industries");
    await expect(firstInvalid).toBeVisible();

    // The control must carry its id at all, and be what the page focused.
    await expect(firstInvalid).toBeFocused();
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
