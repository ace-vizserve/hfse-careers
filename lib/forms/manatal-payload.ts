import { MANATAL_FIELDS } from "@/lib/forms/application-fields";
import {
  formatEducations,
  formatExperiences,
  formatFamilyParticularsToHTML,
  formatReferencesToHTML,
  generateDeclarationList,
} from "@/lib/utils";
import type { JobApplicationFormValues } from "@/lib/validators/job-application";

/** One answer as Manatal is handed it, and the form key it came from. */
export type ManatalEntry = {
  /** The schema key that owns this answer, so a step can pick out its own. */
  key: string;
  /** The Manatal custom-field id it is filed under. */
  id: string;
  value: unknown;
  /** True when the answer has an input of its own an error can be attached to. */
  scalar: boolean;
};

export type ManatalIds = {
  /** Resolves a custom-field id from Manatal's live list, with a fallback. */
  resolve: (slug: string, label: string | undefined, fallback: string) => string;
  /** The education and experience sections have no fallback id; absent, they are not sent. */
  educationId?: string;
  experienceId?: string;
};

/**
 * Every answer on the form, shaped exactly as Manatal is sent it.
 *
 * Submission and the per-step check both build from this, so what Manatal is
 * asked about on a step is what it will later be given. The step check used
 * to send only the single-value fields, so family particulars, education,
 * experience, references and declarations -- steps 2 to 4 -- reached Manatal
 * for the first time at submission, and anything it disliked there surfaced
 * after the candidate thought they had finished.
 */
export function buildManatalEntries(values: JobApplicationFormValues, ids: ManatalIds): ManatalEntry[] {
  const entries: ManatalEntry[] = [];
  const answers = values as JobApplicationFormValues & Record<string, unknown>;

  for (const field of MANATAL_FIELDS) {
    const raw = answers[field.key];
    let value: unknown;

    if (typeof raw === "string") value = raw.trim();
    else if (Array.isArray(raw)) value = raw.join(",");
    else value = raw ?? "";

    entries.push({ key: field.key, id: ids.resolve(field.key, field.label, field.manatalId), value, scalar: true });
  }

  const familyMembers = values.family_members
    .filter((m) => m.name.trim())
    .map((m) => ({
      name: m.name.trim(),
      relationship: m.relationship.trim(),
      nationality: m.nationality.trim(),
      age: m.age.trim(),
      occupation: m.occupation.trim(),
      company: m.company.trim(),
    }));

  entries.push({
    key: "family_members",
    id: ids.resolve("familyparticulars", "Family Particulars", "1741709"),
    value: formatFamilyParticularsToHTML(familyMembers),
    scalar: false,
  });

  const educations = formatEducations(values.educations);
  if (ids.educationId && educations.length) {
    entries.push({ key: "educations", id: ids.educationId, value: educations, scalar: false });
  }

  const experiences = formatExperiences(values.experiences);
  if (ids.experienceId && experiences.length) {
    entries.push({ key: "experiences", id: ids.experienceId, value: experiences, scalar: false });
  }

  const references = values.references
    .filter((ref) => ref.name.trim() || ref.email.trim() || ref.contact_no.trim())
    .map((ref) => ({
      name: ref.name.trim(),
      email: ref.email.trim(),
      contact_no: ref.contact_no.trim(),
      company_occupation: ref.company_occupation.trim(),
      relationship: ref.relationship.trim(),
      years_known: ref.years_known.trim(),
      is_work_related: ref.is_work_related,
      consent_to_contact: ref.consent_to_contact,
    }));

  entries.push({
    key: "references",
    id: ids.resolve("referencedetails", "Character References", "1741707"),
    value: formatReferencesToHTML(references),
    scalar: false,
  });

  const declarations = Object.fromEntries(
    values.declarations.map((item, index) => [index, { answer: item.answer, details: item.details || "" }]),
  );

  entries.push({
    key: "declarations",
    id: ids.resolve("declarationdetails", "Declaration", "1741708"),
    value: generateDeclarationList(declarations),
    scalar: false,
  });

  for (const [key, label, fallback] of [
    ["skipbackgroundcheck", "Skip Background Check", "1771366"],
    ["rcbcrequestissued", "RC/BC Request Issued", "1771465"],
    ["bcrequestissued", "BC Request Issued", "1771466"],
  ] as const) {
    entries.push({ key, id: ids.resolve(key, label, fallback), value: values[key], scalar: false });
  }

  return entries;
}

/** Whether an entry carries anything worth putting to Manatal. */
export const hasAnswer = (entry: ManatalEntry) =>
  entry.value !== "" && entry.value !== null && entry.value !== undefined;
