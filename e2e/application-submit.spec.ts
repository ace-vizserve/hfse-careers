import { expect, test } from "@playwright/test";
import { getApplicationField } from "../lib/forms/application-fields";
import { applicant, formFieldsFixture, JOB_ID, JOB_ORGANIZATION_NAME, jobFixture } from "./support/fixtures";
import {
  field,
  fillAboutYou,
  fillText,
  fillValidApplication,
  gotoApplyPage,
  settleStepCheck,
  submitButton,
} from "./support/application-form";
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
    expect(payload.position_name).toBe(jobFixture.position_name);
    expect(payload.organization_name).toBe(JOB_ORGANIZATION_NAME);
    expect(Object.keys(payload).length).toBeGreaterThan(15);

    // The whole payload, not just its string fields: education and experience
    // are filed as arrays of objects.
    const sent = JSON.stringify(payload);

    // Personal details, from the first step.
    expect(sent).toContain(applicant.fullName);
    expect(sent).toContain(applicant.email);
    expect(sent).toContain(applicant.nric);

    // Emergency contact and family particulars.
    expect(sent).toContain("Mei Ling Tan");
    expect(sent).toContain("Wei Ming Tan");

    // Education and experience, which travel as arrays under ids resolved from
    // Manatal's field list rather than under a key the form knows up front.
    expect(sent).toContain("National University of Singapore");
    expect(sent).toContain("Mathematics Teacher");

    // All three references, assembled into HTML on the last step.
    for (const referee of ["Referee 1", "Referee 2", "Referee 3"]) {
      expect(sent).toContain(referee);
    }

    // The resume travels as a URL rather than the file itself.
    expect(sent).toMatch(/https?:\/\/\S+/);

    // Which custom-field id each answer is filed under, not just that the value
    // was sent. The ids in APPLICATION_FIELDS were wrong for a long time and
    // nothing noticed: the date of birth went under Manatal's Gender id, which
    // takes any string, so the ATS filed it without complaint and left Date of
    // Birth null. The page asks Manatal for its ids now and falls back to the
    // table only when that list arrives empty.
    //
    // The stub advertises a different id for Date of Birth than the table
    // carries, so whichever id the date lands under says which source won.
    const advertised = String(formFieldsFixture.find((field) => field.name === "birth_date")!.id);
    const hardcoded = getApplicationField("birth_date").manatalId!;

    // Guards this assertion itself: if the two ever agree, it proves nothing.
    expect(advertised).not.toBe(hardcoded);

    expect(payload[advertised]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload[hardcoded]).not.toBe(payload[advertised]);
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

  /**
   * Manatal rejects 11 digits or more on its numeric fields, and only at
   * submission -- a candidate filled in the whole form and was told "Expected
   * Salary should be a numerical value" at the very end, with nothing on screen
   * to explain it. The input stops at the ceiling instead.
   */
  test("a salary too large for Manatal cannot be typed in the first place", async ({ page }) => {
    await installApiMocks(page);
    await gotoApplyPage(page);

    const salary = field(page, "expected_salary");
    await salary.fill("");
    await salary.pressSequentially("123456789012");

    await expect(salary).toHaveValue("1234567890");

    const experience = field(page, "years_of_experience");
    await experience.fill("");
    await experience.pressSequentially("123456789012");

    await expect(experience).toHaveValue("1234567890");
  });

  /**
   * The schema cannot know what Manatal will take, so a value it dislikes used
   * to travel all the way to submission: the candidate filled in four steps,
   * pressed Submit, and was told their step 1 salary was wrong. Each step is
   * now put to Manatal before it is left, so the answer arrives on the field.
   */
  test("a value Manatal will not take stops the step that owns it", async ({ page }) => {
    const api = await installApiMocks(page);
    await gotoApplyPage(page);

    await fillAboutYou(page);

    // Religion is a plain text box here and a 255-character field to Manatal.
    // Nothing in the form knows that ceiling, which is the whole point: this is
    // a value the schema is perfectly happy with and only Manatal refuses.
    await fillText(page, "religion", "a".repeat(300));

    await page.getByRole("button", { name: "Continue" }).click();
    await settleStepCheck(page);

    // Still on step 1, with Manatal's own words against the field that caused
    // it -- rather than three steps later, as a toast, at submission.
    await expect(page.getByRole("heading", { name: "Application Information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Family Particulars" })).toBeHidden();
    await expect(page.getByText(/Religion field may not be greater than 255 characters/i)).toBeVisible();

    expect(api.submissions).toHaveLength(0);
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
