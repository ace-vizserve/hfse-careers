import { normalizeApplicationData } from "@/lib/utils";

/**
 * Strip a step's answers down to something Manatal is guaranteed to reject.
 *
 * Manatal has no validate-only endpoint: the only way to ask whether a step's
 * answers are acceptable is to POST the application and read the rejection.
 * That makes this function the safety of the whole feature -- a probe Manatal
 * *accepts* files a real application under a candidate's name, silently,
 * because they clicked Continue.
 *
 * So at least one field Manatal requires must be absent. A step's answers are
 * normally missing plenty; when they are not, the last required field is
 * withheld deliberately. The caller never reports the withheld field, because
 * the candidate did not leave it out -- we did.
 *
 * It lives here rather than in the route because a Next route module may only
 * export handlers, and this needs to be tested directly: a bug here is not the
 * kind you want to find in production.
 */
export function buildIncompleteProbe(
  applicationData: Record<string, unknown>,
  fields: { id: string | number; isRequired?: boolean }[],
): { probe: Record<string, unknown>; withheld: string | undefined } {
  const probe = normalizeApplicationData({ ...applicationData });
  const requiredIds = fields.filter((field) => field.isRequired).map((field) => String(field.id));

  if (requiredIds.length === 0) return { probe, withheld: undefined };

  const missing = requiredIds.find((id) => !(id in probe));

  if (missing) return { probe, withheld: missing };

  const withheld = requiredIds[requiredIds.length - 1];
  delete probe[withheld];

  return { probe, withheld };
}

/**
 * The value complaints in a Manatal rejection, matched back to the field each
 * is about.
 *
 * Manatal answers with either `detail`, the required fields still missing, or
 * `application_data`, the values it will not take. Only the second is
 * reported: a step-by-step probe is missing later steps by design, and telling
 * a candidate on step 1 that their references are missing would be nonsense.
 *
 * Each message names the field by label -- "Field Expected Salary should be a
 * numerical value", "The Religion field may not be greater than 255
 * characters" -- so the label is what maps it back.
 */
export function readValueProblems(
  body: string,
  fields: { id: string | number; label?: string }[],
): { id: string; message: string }[] {
  let parsed: { application_data?: unknown };

  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }

  const raw = parsed?.application_data;

  if (!Array.isArray(raw)) return [];

  const messages = raw.filter((entry): entry is string => typeof entry === "string");

  // Longest label first, so "Emergency Contact Name" wins over "Name".
  const byLabelLength = [...fields]
    .filter((field) => field.label)
    .sort((a, b) => (b.label as string).length - (a.label as string).length);

  return messages.map((message) => {
    const match = byLabelLength.find((field) =>
      message.toLowerCase().includes((field.label as string).toLowerCase()),
    );

    return { id: match ? String(match.id) : "", message };
  });
}
