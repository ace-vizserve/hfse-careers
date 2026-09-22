import { expect, test } from "@playwright/test";
import { applicant, JOB_ID } from "./support/fixtures";
import {
  currentStep,
  field,
  fillAboutYou,
  fillFamilyAndEducation,
  fillText,
  fillValidApplication,
  gotoApplyPage,
  jumpToStep,
  readDraft,
  seedDraft,
  stepMarker,
  submitButton,
  uploadResume,
} from "./support/application-form";
import { installApiMocks } from "./support/mock-api";

/** Longer than the form's 500ms autosave debounce, with room for a slow worker. */
const AFTER_AUTOSAVE = 1_500;

/**
 * The draft the form itself would have written, for tests that need to start
 * from a saved state rather than type their way into one.
 */
const draftWith = (values: Record<string, unknown>, overrides: Record<string, unknown> = {}) => ({
  state: {
    jobId: JOB_ID,
    activeStep: 0,
    maxVisitedStep: 0,
    completedSteps: [],
    values,
    ...overrides,
  },
  version: 1,
});

test.describe("draft persistence", () => {
  test("answers survive a reload", async ({ page }) => {
    await installApiMocks(page);
    await gotoApplyPage(page);

    await fillText(page, "full_name", applicant.fullName);
    await fillText(page, "religion", "Buddhism");
    await page.waitForTimeout(AFTER_AUTOSAVE);

    await page.reload({ waitUntil: "domcontentloaded" });
    await gotoApplyPage(page);

    await expect(field(page, "full_name")).toHaveValue(applicant.fullName);
    await expect(field(page, "religion")).toHaveValue("Buddhism");
  });

  test("a draft written by an older build is discarded rather than merged", async ({ page }) => {
    await installApiMocks(page);

    // Version 0 is anything this build did not write. Half a shape reaching the
    // form shows up as fields that fail validation with nothing to explain why.
    await seedDraft(page, {
      ...draftWith({ full_name: "Stale Draft Person", religion: "Buddhism" }),
      version: 0,
    });

    await gotoApplyPage(page);

    await expect(field(page, "full_name")).toHaveValue("");
    await expect(field(page, "religion")).toHaveValue("");
  });

  test("a draft short of a whole section is topped up from the defaults", async ({ page }) => {
    await installApiMocks(page);

    // Two declarations where the form now asks five, which is what a draft
    // written before a question was added looks like. The rows are indexed
    // against a fixed list, so the missing three used to render unanswerable.
    await seedDraft(
      page,
      draftWith(
        {
          full_name: applicant.fullName,
          declarations: [
            { answer: "Yes", details: "A prior condition" },
            { answer: "No", details: "" },
          ],
          references: [{ name: "Only Referee", email: "", contact_no: "" }],
        },
        { activeStep: 3, maxVisitedStep: 3, completedSteps: [0, 1, 2] },
      ),
    );

    await gotoApplyPage(page);
    await expect(page.getByRole("heading", { name: "Declaration" })).toBeVisible();

    // All five questions answerable, the saved two keeping their answers and
    // the rest seeded to the default "No".
    await expect(field(page, "declarations.0.answer").locator('input[value="Yes"]')).toBeChecked();
    for (let i = 1; i < 5; i++) {
      await expect(field(page, `declarations.${i}.answer`).locator('input[value="No"]')).toBeChecked();
    }

    // Same for a references array saved one row long, against a minimum of three.
    await expect(page.locator('[id^="field-references-"][id$="-name"]')).toHaveCount(3);
    await expect(field(page, "references.0.name")).toHaveValue("Only Referee");
  });

  test("the form still works when sessionStorage refuses to store anything", async ({ page }) => {
    await installApiMocks(page);

    // Over quota, or storage blocked mid-session. The write threw from inside
    // the debounced save, which is to say from inside a keystroke.
    await page.addInitScript(() => {
      window.sessionStorage.setItem = () => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      };
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await gotoApplyPage(page);

    await fillText(page, "full_name", applicant.fullName);
    await fillText(page, "religion", "Buddhism");
    await page.waitForTimeout(AFTER_AUTOSAVE);

    // Scoped to the failure under test. Firefox's Supabase auth client reports
    // a Navigator LockManager failure on this page that has nothing to do with
    // the draft, and "no errors at all" turns that into a failure about
    // storage. That the page came up hydrated at all is the stronger signal
    // here anyway -- before the fix it did not.
    expect(pageErrors.filter((message) => /quota/i.test(message))).toEqual([]);
    await expect(field(page, "full_name")).toHaveValue(applicant.fullName);

    // And it is still a working form, not just a quiet one.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Application Information" })).toBeVisible();
  });
});

test.describe("step navigation", () => {
  test("a step broken after it was completed cannot be skipped over", async ({ page }) => {
    await installApiMocks(page);
    await gotoApplyPage(page);

    await fillAboutYou(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Family Particulars" })).toBeVisible();

    await fillFamilyAndEducation(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Employment History" })).toBeVisible();

    // Back to step 2 and break it, then back to step 1. Both moves are
    // backwards, which the form does not validate -- nothing has gone wrong yet.
    await jumpToStep(page, 1);
    await fillText(page, "family_members.0.name", "");
    await jumpToStep(page, 0);
    expect(await currentStep(page)).toBe(0);

    // Now the jump that used to sail over it: the rail allows step 3 because it
    // has been visited, and only the step underfoot was ever re-checked.
    await jumpToStep(page, 2);

    expect(await currentStep(page)).toBe(1);
    await expect(page.getByRole("heading", { name: "Family Particulars" })).toBeVisible();
    await expect(field(page, "family_members.0.name")).toBeFocused();
  });

  test("the rail flags a completed step that no longer validates", async ({ page }) => {
    await installApiMocks(page);
    await gotoApplyPage(page);

    await fillAboutYou(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Family Particulars" })).toBeVisible();

    // Step 2 is visited but empty, so it is outstanding. Stepping back off it
    // is what makes that visible -- the step underfoot is never flagged.
    await expect(await stepMarker(page, 0)).toHaveAttribute("data-step-state", "complete");

    await jumpToStep(page, 0);

    expect(await currentStep(page)).toBe(0);
    await expect(await stepMarker(page, 1)).toHaveAttribute("data-step-state", "invalid");
    // And the step ahead of everything visited is left alone.
    await expect(await stepMarker(page, 3)).toHaveAttribute("data-step-state", "upcoming");
  });
});

test.describe("what is still outstanding", () => {
  test("is named above Submit, and clicking it goes to the field", async ({ page }) => {
    const api = await installApiMocks(page);
    await gotoApplyPage(page);

    // Everything but the third reference, so Submit is disabled on the last
    // step with the offending field far up the page.
    await fillValidApplication(page);
    await fillText(page, "references.2.name", "");
    await fillText(page, "references.2.email", "");

    await expect(submitButton(page)).toBeDisabled();

    const summary = page.getByRole("status");
    await expect(summary).toContainText("still needed");
    await expect(summary).toContainText("Declarations");

    // The row index is named, because "Name is required" three times over says
    // nothing about which referee is short.
    const entry = summary.getByRole("button", { name: /entry 3/ }).first();
    await expect(entry).toBeVisible();

    await entry.click();
    await expect(field(page, "references.2.name")).toBeFocused();

    // Filling it in is all that stood between the candidate and submission.
    await fillText(page, "references.2.name", "Referee 3");
    await fillText(page, "references.2.email", "referee3.e2e@example.com");
    await expect(submitButton(page)).toBeEnabled();
    expect(api.submissions).toHaveLength(0);
  });

  test("names a field on an earlier step and takes the candidate back to it", async ({ page }) => {
    await installApiMocks(page);

    // A draft that reaches the last step with an earlier one incomplete -- the
    // state the form can be reloaded into, whatever the rail allows.
    await seedDraft(
      page,
      draftWith(
        { full_name: "", religion: "Buddhism" },
        { activeStep: 3, maxVisitedStep: 3, completedSteps: [0, 1, 2] },
      ),
    );

    await gotoApplyPage(page);
    await expect(page.getByRole("heading", { name: "Declaration" })).toBeVisible();

    const summary = page.getByRole("status");
    await expect(summary).toContainText("About You");

    await summary.getByRole("button", { name: "Full name is required" }).click();

    // Crossing a step boundary: the field is not in the DOM when the click
    // lands, so the page has to change step before it can focus anything.
    expect(await currentStep(page)).toBe(0);
    await expect(field(page, "full_name")).toBeFocused();
  });
});

test.describe("after a successful submit", () => {
  test("the draft is gone for good", async ({ page }) => {
    const api = await installApiMocks(page);
    await gotoApplyPage(page);

    await fillValidApplication(page);

    // Submit on the heels of the last keystroke, so a debounced save is still
    // armed when the response comes back. It used to land after the clear and
    // put an NRIC, a passport number and a date of birth back into storage.
    await submitButton(page).click();

    await expect(page.getByRole("heading", { name: "Application Submitted!" })).toBeVisible({ timeout: 30_000 });
    expect(api.submissions).toHaveLength(1);

    await page.waitForTimeout(AFTER_AUTOSAVE);

    const draft = await readDraft(page);
    expect(draft?.state.values ?? null).toBeNull();

    // A reload lands on an empty form rather than resurrecting the application.
    await page.reload({ waitUntil: "domcontentloaded" });
    await gotoApplyPage(page);
    await expect(field(page, "full_name")).toHaveValue("");
  });

  test("closing the page does not ask about unsaved work", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "beforeunload dialogs are only reliably observable in Chromium");

    await installApiMocks(page);
    await gotoApplyPage(page);

    await fillValidApplication(page);
    await submitButton(page).click();
    await expect(page.getByRole("heading", { name: "Application Submitted!" })).toBeVisible({ timeout: 30_000 });

    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.type());
      void dialog.dismiss();
    });

    await page.close({ runBeforeUnload: true });
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    expect(dialogs).toEqual([]);
  });

  test("an unsent form still warns before it is thrown away", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "beforeunload dialogs are only reliably observable in Chromium");

    await installApiMocks(page);
    await gotoApplyPage(page);

    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.type());
      void dialog.dismiss();
    });

    // Untouched: nothing to lose, so nothing to ask about.
    await page.evaluate(() => window.dispatchEvent(new Event("beforeunload", { cancelable: true })));
    expect(dialogs).toEqual([]);

    await fillText(page, "full_name", applicant.fullName);

    await page.close({ runBeforeUnload: true });
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    expect(dialogs).toEqual(["beforeunload"]);
  });
});

test.describe("resume", () => {
  test("a resume carried in by a draft survives a failed re-upload", async ({ page }) => {
    await installApiMocks(page);
    await gotoApplyPage(page);

    await uploadResume(page);
    await page.waitForTimeout(AFTER_AUTOSAVE);

    const uploaded = (await readDraft(page))?.state.values?.resume as string;
    expect(uploaded).toBeTruthy();

    // Reload, so the URL is one the draft restored and the dropzone itself
    // knows nothing about.
    await page.reload({ waitUntil: "domcontentloaded" });
    await gotoApplyPage(page);
    await expect(page.getByText("A resume from your saved draft is attached.")).toBeVisible();

    // Now a second upload that fails outright. The batch finishing with nothing
    // in it used to read as "the file was removed".
    await page.route(/\/storage\/v1\/object\//, (route) =>
      route.fulfill({ status: 500, json: { message: "Bucket unavailable" } }),
    );

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "replacement.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\ntrailer<</Root 1 0 R>>\n%%EOF\n", "utf8"),
    });

    await expect(page.getByText("Bucket unavailable")).toBeVisible();
    await page.waitForTimeout(AFTER_AUTOSAVE);

    // The original is still the answer on file, and the form is not telling the
    // candidate to upload something they already have.
    expect((await readDraft(page))?.state.values?.resume).toBe(uploaded);
    await expect(page.getByText("Please upload a resume file")).toBeHidden();
  });
});
