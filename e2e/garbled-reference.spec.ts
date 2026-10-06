import { expect, test } from "@playwright/test";
import { looksGarbled } from "../lib/forms/garbled-text";
import {
  continueToNextStep,
  field,
  fillAboutYou,
  fillExperience,
  fillFamilyAndEducation,
  fillText,
  gotoApplyPage,
} from "./support/application-form";
import { installApiMocks } from "./support/mock-api";

/**
 * A candidate's Android keyboard reset the cursor after every letter, and
 * three references reached Manatal as "atanacAC yrAG" and "dneiRF". The form
 * puts the letters back as they are typed, and refuses whatever still arrives
 * backwards until the candidate retypes it.
 */
test.describe("references typed backwards", () => {
  test("the detector flags reversed text and leaves real names alone", () => {
    for (const garbled of [
      "atanacAC yraGyrAGacAC yrAG",
      "dneiRFeiRF",
      "arierEP ronoeLE",
      "ColleaguegaelloCwOC",
      "nilorAC ahsEN",
      "eugaelloCaellOC",
      "alejdaNadjeN",
      "dneirF",
      "efiW",
      "ssoB",
      "eugaelloc xE",
      "agruD",
    ]) {
      expect(looksGarbled(garbled), garbled).toBe(true);
    }

    for (const fine of [
      "Gary Cacanta",
      "Friend",
      "Former Supervisor",
      "Ronald McDonald",
      "Marie LeBlanc",
      "Juan dela Cruz",
      "TAN AH KOW",
      "HoD",
      "Mary-Jane O'Neil",
      "PhyuPhyuMyint",
      "KyiKyiAye",
      "Mr Tan, HoD",
      "",
    ]) {
      expect(looksGarbled(fine), fine).toBe(false);
    }
  });

  test("the reference step refuses a backwards name or relationship", async ({ page }) => {
    test.setTimeout(180_000);
    await installApiMocks(page);
    await gotoApplyPage(page);
    await fillAboutYou(page);
    await continueToNextStep(page, "Family Particulars");
    await fillFamilyAndEducation(page);
    await continueToNextStep(page, "Employment History");
    await fillExperience(page);
    await continueToNextStep(page, "Declaration");

    // Under the fields themselves; the outstanding summary repeats it lower down.
    const refusal = page.locator("#field-references-root").getByText("This looks typed backwards. Please retype it.");
    const name = field(page, "references.0.name");

    // On a phone every reference field is full width, one per row. The rows
    // below them once spanned two columns of a one-column grid, which squeezed
    // Name and Relationship into a 119px column -- the only two text fields the
    // backwards typing ever hit.
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      const boxes = [];
      for (const key of ["name", "email", "contact_no", "company_occupation", "relationship", "years_known"])
        boxes.push(await field(page, `references.0.${key}`).boundingBox());
      for (const box of boxes) {
        expect(box!.x).toBe(boxes[0]!.x);
        expect(box!.width).toBe(boxes[0]!.width);
      }
    }

    await expect(name).toHaveAttribute("autocomplete", "off");
    await expect(name).toHaveAttribute("autocapitalize", "words");

    // The form validates a field once it has been left, so each one is blurred.
    for (const [key, value] of [
      ["name", "atanacAC yrAG"],
      ["relationship", "dneiRF"],
    ] as const) {
      await fillText(page, `references.0.${key}`, value);
      await field(page, `references.0.${key}`).blur();
    }
    await expect(refusal).toHaveCount(2);

    await fillText(page, "references.0.name", "Gary Cacanta");
    await fillText(page, "references.0.relationship", "Friend");
    await expect(refusal).toHaveCount(0);

    // Recreate the phones: after every letter, the cursor goes back to the start.
    await page.evaluate(() => {
      for (const id of ["field-references-1-name", "field-references-1-relationship", "field-references-1-company_occupation"]) {
        const input = document.getElementById(id) as HTMLInputElement;
        // A microtask runs once the keystroke's handlers are done and before
        // the next one, so the jump lands between every pair of letters.
        input.addEventListener("input", () => queueMicrotask(() => input.setSelectionRange(0, 0)));
      }
    });

    // Unguarded, the field reverses exactly as the candidates' references did.
    await field(page, "references.1.company_occupation").click();
    await field(page, "references.1.company_occupation").pressSequentially("Friend", { delay: 30 });
    await expect(field(page, "references.1.company_occupation")).toHaveValue("dneirF");

    // Guarded, the letters stay where the candidate typed them, in the form's
    // own state as well as on screen -- the refusal reads the former.
    for (const [key, value] of [
      ["name", "Eleonor Pereira"],
      ["relationship", "Colleague"],
    ] as const) {
      await field(page, `references.1.${key}`).click();
      await field(page, `references.1.${key}`).pressSequentially(value, { delay: 30 });
      await expect(field(page, `references.1.${key}`)).toHaveValue(value);
      await field(page, `references.1.${key}`).blur();
    }
    await expect(refusal).toHaveCount(0);
  });

  test("the guard leaves a deliberate edit at the start alone", async ({ page }) => {
    test.setTimeout(180_000);
    await installApiMocks(page);
    await gotoApplyPage(page);
    await fillAboutYou(page);
    await continueToNextStep(page, "Family Particulars");
    await fillFamilyAndEducation(page);
    await continueToNextStep(page, "Employment History");
    await fillExperience(page);
    await continueToNextStep(page, "Declaration");

    const relationship = field(page, "references.0.relationship");
    await relationship.click();
    await relationship.pressSequentially("colleague", { delay: 30 });
    // Tap at the very start, the way a candidate would on a phone.
    await relationship.click({ position: { x: 3, y: 10 } });
    await relationship.pressSequentially("Ex ", { delay: 30 });
    await expect(relationship).toHaveValue("Ex colleague");

    await relationship.click();
    await relationship.evaluate((el: HTMLInputElement) => el.setSelectionRange(el.value.length, el.value.length));
    await relationship.press("Backspace");
    await relationship.pressSequentially("ue", { delay: 30 });
    await expect(relationship).toHaveValue("Ex colleaguue");
  });
});
