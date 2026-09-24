import { expect, test } from "@playwright/test";
import { buildIncompleteProbe } from "../lib/forms/manatal-probe";

/**
 * Manatal has no validate-only endpoint. The only way to ask whether a step's
 * answers are acceptable is to POST the application and read the rejection --
 * which means a probe Manatal *accepts* files a real application under a
 * candidate's name, silently, just because they clicked Continue.
 *
 * The one thing standing between this feature and that outcome is that the
 * probe always omits a field Manatal requires. These tests are that guarantee.
 */
test.describe("step-validation probe", () => {
  const fields = [
    { id: 1741679, isRequired: true },
    { id: 1741680, isRequired: true },
    { id: 1741691, isRequired: false },
    { id: 1741686, isRequired: true },
  ];

  const requiredIds = fields.filter((field) => field.isRequired).map((field) => String(field.id));

  const leavesSomethingRequiredOut = (probe: Record<string, unknown>) =>
    requiredIds.some((id) => !(id in probe));

  test("a partly filled step leaves required fields out on its own", () => {
    const { probe, withheld } = buildIncompleteProbe({ "1741679": "Alex Tan" }, fields);

    expect(withheld).toBeDefined();
    expect(leavesSomethingRequiredOut(probe)).toBe(true);
  });

  test("a step carrying every required answer still has one withheld", () => {
    const complete: Record<string, unknown> = {};
    for (const field of fields) complete[String(field.id)] = "filled";

    const { probe, withheld } = buildIncompleteProbe(complete, fields);

    expect(withheld).toBeDefined();
    expect(probe[withheld as string]).toBeUndefined();
    expect(leavesSomethingRequiredOut(probe)).toBe(true);
  });

  test("a blank or whitespace-only answer does not count as supplying the field", () => {
    // normalizeApplicationData drops empties before the payload is sent, so a
    // field holding "   " must not be mistaken for one Manatal has been given.
    const { probe } = buildIncompleteProbe({ "1741679": "", "1741680": "   " }, fields);

    expect(probe["1741679"]).toBeUndefined();
    expect(leavesSomethingRequiredOut(probe)).toBe(true);
  });

  test("no required fields at all means no probe is sent", () => {
    const { withheld } = buildIncompleteProbe({ "1": "a" }, [{ id: 1, isRequired: false }]);

    // The route reads this as "cannot be proven to fail" and skips the check
    // rather than risking a submission.
    expect(withheld).toBeUndefined();
  });
});
