import { expect, type Page } from "@playwright/test";
import { applicant, JOB_ID, resumePdf } from "./fixtures";

/** Next compiles a route on first hit, and five browser projects share one dev server. */
const COLD_START_TIMEOUT = 90_000;

/**
 * Opens the apply page and waits for the form to be genuinely interactive.
 * The page is prerendered, so its fields paint before React attaches and a
 * click that lands in that gap does nothing; `data-interactive` says when the
 * gap has closed. The timeout is generous because Next compiles the route on
 * first hit and five browser projects share one dev server.
 */
export async function gotoApplyPage(page: Page) {
  await page.goto(`/jobs/${JOB_ID}/apply`, { waitUntil: "domcontentloaded" });

  // `data-interactive` sits on the page root rather than the form, because the
  // Back/Continue/Submit bar is outside the form and needs the same guard.
  await expect(page.locator("[data-interactive]")).toHaveAttribute("data-interactive", "true", {
    timeout: COLD_START_TIMEOUT,
  });
  await dismissPdpaNotice(page);
  // Step-agnostic: a restored draft can open the form on any step, so there is
  // no one field that is always on screen.
  await expect(page.locator("#job-application-form")).toBeVisible();
}

/** Acknowledgement is remembered in this cookie for a year. */
const PDPA_COOKIE = "hfse_pdpa_notice";

/**
 * The PDPA notice opens over every non-embed page on a first visit and its
 * overlay swallows clicks. None of these tests are about the notice, so they
 * acknowledge it the way a candidate would and get on with the form. It only
 * appears once the page has hydrated, hence the same generous timeout.
 *
 * It appears once per browser context, so a reload or a second visit inside one
 * test will not show it again -- the cookie says which of the two this is,
 * without a timeout to wait out either way.
 */
export async function dismissPdpaNotice(page: Page) {
  const cookies = await page.context().cookies();
  if (cookies.some((cookie) => cookie.name === PDPA_COOKIE)) return;

  const acknowledge = page.getByRole("button", { name: "I understand" });

  await acknowledge.click({ timeout: COLD_START_TIMEOUT });
  await expect(acknowledge).toBeHidden();
}

/** The page derives every input id from the RHF path: `field-` + path with dots as dashes. */
export const field = (page: Page, path: string) => page.locator(`#field-${path.replace(/\./g, "-")}`);

export async function fillText(page: Page, path: string, value: string) {
  const input = field(page, path);

  // Clearing a field on purpose, for tests about what a form does with a hole
  // in it.
  if (value === "") {
    await input.fill("");
    await expect(input).toHaveValue("");
    return;
  }

  // These inputs are controlled (Controller + value/onChange), so a fill is a
  // DOM write plus an input event that React has to process. A re-render
  // landing in between writes the old value back and the fill is gone without
  // a word -- surfacing much later as a step that will not advance. Seen once
  // in ~47 full-form fills. Retry until it takes.
  //
  // Several of these fields normalise what they are handed (digits only, upper
  // case), so this asks whether the value stuck at all, not whether it came
  // back verbatim.
  await expect(async () => {
    await input.fill(value);
    await expect(input).not.toHaveValue("");
  }).toPass({ timeout: 15_000 });
}

/** Radix Select: click the trigger, then pick a listbox option. */
export async function chooseOption(page: Page, path: string, name?: string) {
  await field(page, path).click();
  const option = name ? page.getByRole("option", { name, exact: true }) : page.getByRole("option").first();
  await option.click();
  await expect(page.getByRole("listbox")).toBeHidden();
}

/** react-day-picker marks today's cell, which saves the test naming a date. */
export async function pickToday(page: Page, path: string) {
  await field(page, path).click();

  const calendar = page.locator('[data-slot="popover-content"]').filter({ has: page.locator("td[data-today]") });
  await calendar.last().locator("td[data-today] button").click();

  // Two date fields in a row: the first popover has to be gone before the next
  // one opens, or "today" matches a cell in each of two calendars.
  await expect(calendar).toHaveCount(0);
}

/** Popover + Command; the row commits the demonym and closes the popover. */
export async function pickNationality(page: Page, path: string, demonym: string) {
  const trigger = field(page, path);

  await trigger.click();
  await page.getByPlaceholder("Type to filter…").fill(demonym);
  await page.getByRole("option").filter({ hasText: demonym }).first().click();
  await expect(trigger).toContainText(demonym);
}

/** Multi-select popover; picks the first industry so the test owns no option names. */
export async function pickFirstIndustry(page: Page) {
  const trigger = field(page, "industries");

  await trigger.click();
  await page.getByRole("option").first().click();

  // Selecting does not close a multi-select, and the open popover covers the
  // fields below it.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option").first()).toBeHidden();
}

export async function uploadResume(page: Page) {
  const upload = page.waitForResponse((response) => /\/storage\/v1\/object\//.test(response.url()));
  await page.locator('input[type="file"]').first().setInputFiles(resumePdf);
  await upload;
}

/** Step 1 - everything the schema needs before "About You" will let go. */
export async function fillAboutYou(page: Page) {
  // 01 - Application details
  await fillText(page, "expected_salary", "6500");
  await pickFirstIndustry(page);
  await fillText(page, "years_of_experience", "8");
  await uploadResume(page);

  // 02 - Personal information
  await fillText(page, "full_name", applicant.fullName);
  await fillText(page, "preferredname", applicant.preferredName);
  await chooseOption(page, "residentialstatus", "Singaporean");
  await pickNationality(page, "nationalities", applicant.nationality);
  await pickToday(page, "birth_date");
  await chooseOption(page, "gender", "Male");
  await fillText(page, "religion", "Buddhism");
  await fillText(page, "nricfin", applicant.nric);
  await chooseOption(page, "latest_degree");
  await fillText(page, "passportno", "K1234567L");
  await fillText(page, "placedateofissue", "Singapore, 12 Jan 2021");

  // 03 - Contact
  await fillText(page, "phone_number", applicant.phone);
  await fillText(page, "email", applicant.email);
  await fillText(page, "address", "10 Bayfront Avenue, #12-34");
  await fillText(page, "postalcode", "238823");

  // 04 - Emergency contact
  await fillText(page, "name", "Mei Ling Tan");
  await fillText(page, "relationship", "Spouse");
  await fillText(page, "address_b", "10 Bayfront Avenue, #12-34");
  await fillText(page, "mobilenumber", "+6598765432");
  await fillText(page, "emailaddress", "mei.ling.e2e@example.com");
}

/** Step 2 - family particulars and education. */
export async function fillFamilyAndEducation(page: Page) {
  // 05 - Family particulars
  await fillText(page, "family_members.0.name", "Wei Ming Tan");
  await chooseOption(page, "family_members.0.relationship", "Father");
  await fillText(page, "family_members.0.nationality", "Singaporean");
  await fillText(page, "family_members.0.age", "62");
  await fillText(page, "family_members.0.occupation", "Retired");
  await fillText(page, "family_members.0.company", "N/A");

  // 06 - Education
  await fillText(page, "educations.0.school", "National University of Singapore");
  await chooseOption(page, "educations.0.degree_name");
  await pickToday(page, "educations.0.started_at");
  await pickToday(page, "educations.0.ended_at");
}

/** Step 3 - work history. Marking it current clears the end-date requirement. */
export async function fillExperience(page: Page) {
  await fillText(page, "experiences.0.title", "Mathematics Teacher");
  await fillText(page, "experiences.0.employer", "Raffles Institution");
  await pickToday(page, "experiences.0.started_at");
  await tickCheckbox(page, "#field-experiences-0-is_current_employer");
}

/**
 * Step 4 - references and consent. `skipReference` leaves one row short, for
 * tests about what the form does while something is still outstanding.
 */
export async function fillDeclarations(page: Page, { skipReference }: { skipReference?: number } = {}) {
  // The schema demands three references, and the form seeds all three rather
  // than hiding the last two behind Add.
  const referenceRows = page.locator('[id^="field-references-"][id$="-name"]');
  await expect(referenceRows).toHaveCount(3);

  for (let i = 0; i < 3; i++) {
    if (i === skipReference) continue;

    await fillText(page, `references.${i}.name`, `Referee ${i + 1}`);
    await fillText(page, `references.${i}.email`, `referee${i + 1}.e2e@example.com`);
    await fillText(page, `references.${i}.contact_no`, `+65912345${i}0`);
    await fillText(page, `references.${i}.company_occupation`, "Head of Department, Raffles Institution");
    await fillText(page, `references.${i}.relationship`, "Former manager");
    await fillText(page, `references.${i}.years_known`, "6");
  }

  // Declarations default to "No" and references default to "I agree", so only
  // the two consent boxes remain; the submit button stays disabled without them.
  await acceptConsent(page);
}

/**
 * Fills every field the Zod schema requires for a Singaporean applicant, using
 * the same widgets a real candidate would touch. Leaves the form one click away
 * from submission.
 */
export async function fillValidApplication(page: Page) {
  await fillAboutYou(page);
  await continueToNextStep(page, "Family Particulars");

  await fillFamilyAndEducation(page);
  await continueToNextStep(page, "Employment History");

  await fillExperience(page);
  await continueToNextStep(page, "Declaration");

  await fillDeclarations(page);
}

/**
 * `sr-only` inputs beside a styled box; the visible sibling is what a user hits.
 * Retried because an early click can land before React attaches the handler.
 */
export async function tickCheckbox(page: Page, selector: string) {
  const input = page.locator(selector);
  const visibleBox = input.locator("xpath=following-sibling::*[1]");

  for (let attempt = 0; attempt < 5; attempt++) {
    if (await input.isChecked()) return;
    await visibleBox.click();
    await page.waitForTimeout(150);
  }

  await expect(input).toBeChecked();
}

/**
 * Candidates click the sentence, not the 20px box. When CheckItem was declared
 * inside ConsentDeclarations it remounted on every render and this click was
 * lost, leaving Submit permanently disabled - so clicking the text here is the
 * regression guard.
 */
export async function acceptConsent(page: Page) {
  await page.locator('label[for="declare-truth"] span').click();
  await expect(page.locator("#declare-truth")).toBeChecked();

  await page.locator('label[for="declare-consent"] span').click();
  await expect(page.locator("#declare-consent")).toBeChecked();
}

/** Advances one step, failing loudly if validation held it back. */
export async function continueToNextStep(page: Page, expectedHeading: string | RegExp) {
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: expectedHeading })).toBeVisible();
}

export const submitButton = (page: Page) => page.getByRole("button", { name: "Submit Application" });

/** The key the zustand persist middleware writes the draft under. */
export const DRAFT_KEY = "hfse-application-draft";

export type PersistedDraft = {
  state: {
    jobId: string | null;
    activeStep: number;
    maxVisitedStep: number;
    completedSteps: number[];
    values: Record<string, unknown> | null;
  };
  version: number;
};

/** Reads the draft the form has autosaved, as the browser sees it. */
export async function readDraft(page: Page): Promise<PersistedDraft | null> {
  return page.evaluate((key) => {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PersistedDraft) : null;
  }, DRAFT_KEY);
}

/**
 * Plants a draft before the page loads, which is the only way to exercise a
 * draft this build did not write -- an older shape, or an older version.
 */
export async function seedDraft(page: Page, draft: PersistedDraft) {
  await page.addInitScript(
    ([key, payload]) => window.sessionStorage.setItem(key as string, payload as string),
    [DRAFT_KEY, JSON.stringify(draft)] as const,
  );
}

/**
 * The step rail is a row of four at md and up, and hides behind a menu on
 * phones. Opening that menu first makes a test read the same either way.
 */
export async function openStepRail(page: Page) {
  const rail = page.locator("[data-step-rail]:visible");

  // Idempotent on purpose. The trigger is a toggle, so asking twice in a row
  // shuts the popover again -- and a click then lands on a marker that is
  // animating out from under it.
  if ((await rail.count()) === 0) {
    await page.locator('button[aria-label*="Change step"]').click();
    await expect(rail).toHaveCount(1);
  }

  return rail;
}

/** The rail button for a step, by its position. */
export async function stepMarker(page: Page, index: number) {
  return (await openStepRail(page)).locator("button").nth(index);
}

/** Jumps via the rail rather than Continue, which is what allows a skip. */
export async function jumpToStep(page: Page, index: number) {
  const rail = await openStepRail(page);
  await rail.locator("button").nth(index).click();

  // On a phone the rail is a popover and picking a step closes it. Nothing else
  // may start while it is on its way out, or the next call finds it still
  // visible and clicks a marker that is being detached underneath it. Off the
  // popover, only the one hidden rail is ever in the DOM.
  await expect(page.locator("[data-step-rail]")).toHaveCount(1);
}

/** Which step is on screen, read off the footer's own counter. */
export async function currentStep(page: Page) {
  const label = await page.getByText(/^Step \d of 4$/).textContent();
  return Number(label?.match(/\d/)?.[0]) - 1;
}
