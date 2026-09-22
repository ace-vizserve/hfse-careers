import { expect, type Page } from "@playwright/test";
import { applicant, JOB_ID, resumePdf } from "./fixtures";

/**
 * Opens the apply page and waits for the form to be interactive. The timeout is
 * generous because Next compiles the route on first hit, and five browser
 * projects share one dev server.
 */
export async function gotoApplyPage(page: Page) {
  await page.goto(`/jobs/${JOB_ID}/apply`, { waitUntil: "domcontentloaded" });
  await dismissPdpaNotice(page);
  await expect(field(page, "full_name")).toBeVisible();
}

/**
 * The PDPA notice opens over every non-embed page on a first visit and its
 * overlay swallows clicks. None of these tests are about the notice, so they
 * acknowledge it the way a candidate would and get on with the form.
 */
export async function dismissPdpaNotice(page: Page) {
  const acknowledge = page.getByRole("button", { name: "I understand" });

  await acknowledge.click();
  await expect(acknowledge).toBeHidden();
}

/** The page derives every input id from the RHF path: `field-` + path with dots as dashes. */
export const field = (page: Page, path: string) => page.locator(`#field-${path.replace(/\./g, "-")}`);

export async function fillText(page: Page, path: string, value: string) {
  await field(page, path).fill(value);
}

/** Radix Select: click the trigger, then pick a listbox option. */
export async function chooseOption(page: Page, path: string, name?: string) {
  await field(page, path).click();
  const option = name ? page.getByRole("option", { name, exact: true }) : page.getByRole("option").first();
  await option.click();
  await expect(page.getByRole("listbox")).toBeHidden();
}

/** The custom calendar has no text input, so use its "Today" shortcut. */
export async function pickToday(page: Page, path: string) {
  await field(page, path).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
}

/** Typeahead combobox: options commit on mousedown and live in a sibling <ul>. */
export async function pickNationality(page: Page, path: string, demonym: string) {
  const input = field(page, path);
  await input.click();
  await input.fill(demonym);
  const container = input.locator("xpath=ancestor::div[2]");
  await container.locator("ul > li").filter({ hasText: demonym }).first().click();
  await expect(input).toHaveValue(new RegExp(demonym));
}

/** Multi-select popover; picks the first industry so the test owns no option names. */
export async function pickFirstIndustry(page: Page) {
  const trigger = field(page, "industries");
  await trigger.click();
  const container = trigger.locator("xpath=ancestor::div[1]");
  await container.locator("ul > li > button").first().click();
  await trigger.click({ force: true });
}

export async function uploadResume(page: Page) {
  const upload = page.waitForResponse((response) => /\/storage\/v1\/object\//.test(response.url()));
  await page.locator('input[type="file"]').first().setInputFiles(resumePdf);
  await upload;
}

/**
 * Fills every field the Zod schema requires for a Singaporean applicant, using
 * the same widgets a real candidate would touch. Leaves the form one click away
 * from submission.
 */
export async function fillValidApplication(page: Page) {
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

  await continueToNextStep(page, "Family Particulars");

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

  await continueToNextStep(page, "Employment History");

  // 07 - Experience. Marking it current clears the end-date requirement.
  await fillText(page, "experiences.0.title", "Mathematics Teacher");
  await fillText(page, "experiences.0.employer", "Raffles Institution");
  await pickToday(page, "experiences.0.started_at");
  await tickCheckbox(page, "#field-experiences-0-is_current_employer");

  await continueToNextStep(page, "Declaration");

  // 08 - References: the schema demands three and the form starts with one.
  const referenceRows = page.locator('[id^="field-references-"][id$="-name"]');
  await expect(referenceRows).toHaveCount(1);
  for (let expected = 2; expected <= 3; expected++) {
    await page.getByRole("button", { name: /Add Reference/i }).click();
    await expect(referenceRows).toHaveCount(expected);
  }

  for (let i = 0; i < 3; i++) {
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
