import { expect, test } from "@playwright/test";
import { applicant, JOB_ID } from "./support/fixtures";
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

    // Sent, not processed: this is the body that left the page, unpacked.
    // Checking a couple of values near the top of it would pass just as well
    // on a body that arrived half-written, so the assertions below reach the
    // sections built last -- the HTML blobs at the far end of the payload.
    const fields = api.submittedFields[0];
    const payload = api.submittedPayloads[0] as Record<string, unknown>;

    expect(fields.jobId).toBe(JOB_ID);
    expect(payload.job_id).toBe(JOB_ID);
    expect(Object.keys(payload).length).toBeGreaterThan(15);

    const sent = Object.values(payload)
      .filter((value): value is string => typeof value === "string")
      .join("\n");

    // Personal details, from the first step.
    expect(sent).toContain(applicant.fullName);
    expect(sent).toContain(applicant.email);
    expect(sent).toContain(applicant.nric);

    // Emergency contact and family particulars.
    expect(sent).toContain("Mei Ling Tan");
    expect(sent).toContain("Wei Ming Tan");

    // All three references, assembled into HTML on the last step.
    for (const referee of ["Referee 1", "Referee 2", "Referee 3"]) {
      expect(sent).toContain(referee);
    }

    // The resume travels as a URL rather than the file itself.
    expect(sent).toMatch(/https?:\/\/\S+/);
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
