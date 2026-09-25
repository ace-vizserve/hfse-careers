import type { JobApplicationFormValues } from "@/lib/validators/job-application";

/**
 * The single source of truth for the scalar fields on the apply form.
 *
 * The form used to be rendered from whatever Manatal's application-form endpoint
 * returned, matched to schema keys by normalising and comparing slug, name,
 * label, category, display type and id. That made every field a guess: when the
 * endpoint omitted a field the schema still required, nothing rendered and the
 * candidate was asked to fix an input that did not exist.
 *
 * Declaring them here instead means the schema, the UI and the Manatal payload
 * all agree by construction. `manatalId` is used only when building the
 * submission payload; changing one is a breaking change against the ATS.
 */

export type FieldWidget =
  | "text"
  | "longtext"
  | "email"
  | "phone"
  | "url"
  | "date"
  | "digits"
  | "number"
  | "salary"
  | "postalcode"
  | "nricfin"
  | "select"
  | "nationality"
  | "industries"
  | "resume";

export type ApplicationField = {
  /** Path into the Zod schema; also drives the DOM id via pathToFieldId. */
  key: keyof JobApplicationFormValues & string;
  label: string;
  widget: FieldWidget;
  /** Manatal custom-field id. See CLAUDE.md before changing any of these. */
  manatalId?: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: readonly { value: string; label: string }[];
  /** Digits-only widgets cap length here (postal code, year). */
  maxLength?: number;
};

const RESIDENTIAL_STATUS_OPTIONS = [
  { value: "Singaporean", label: "Singaporean" },
  { value: "PR", label: "PR" },
  { value: "Foreigner", label: "Foreigner" },
] as const;

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

const QUALIFICATION_OPTIONS = [
  { value: "High School Diploma", label: "High School Diploma" },
  { value: "Associates Degree", label: "Associate's Degree" },
  { value: "Bachelors Degree", label: "Bachelor's Degree" },
  { value: "Masters Degree", label: "Master's Degree" },
  { value: "Doctorate", label: "Doctorate" },
] as const;

export const WORK_PASS_OPTIONS = [
  "Dependant's Pass (DP)",
  "Employment Pass (EP)",
  "EntrePass",
  "Long-Term Visit Pass (LTVP)",
  "Permanent Residency (PR)",
  "S Pass",
  "Short-Term Visit Pass (STVP)/Visit Pass",
  "Training Employment Pass",
  "Work Holiday Pass",
  "Work Permit (WP)",
  "Student Pass",
  "No Permit/Pass",
] as const;

export const APPLICATION_FIELDS = [
  // 01 - Application details
  {
    key: "expected_salary",
    label: "Expected Salary",
    widget: "salary",
    manatalId: "1741684",
    required: true,
    placeholder: "e.g. 3500",
  },
  {
    key: "linkedin",
    label: "LinkedIn Profile URL",
    widget: "url",
    manatalId: "1741685",
    placeholder: "https://linkedin.com/in/yourprofile",
  },
  { key: "industries", label: "Work Industry", widget: "industries", manatalId: "1741702", required: true },
  {
    key: "years_of_experience",
    label: "Years of Experience",
    widget: "number",
    manatalId: "1741703",
    required: true,
  },
  { key: "resume", label: "Resume", widget: "resume", manatalId: "1741683", required: true },
  {
    key: "preferredsubjectsandlevels",
    label: "Preferred Subjects and Levels",
    widget: "text",
    manatalId: "1820601",
  },

  // 02 - Personal information
  { key: "full_name", label: "Full Name", widget: "text", manatalId: "1741679", required: true },
  { key: "preferredname", label: "Preferred Name", widget: "text", manatalId: "1741704", required: true },
  {
    key: "residentialstatus",
    label: "Residential Status",
    widget: "select",
    manatalId: "1741697",
    required: true,
    placeholder: "Select residential status",
    options: RESIDENTIAL_STATUS_OPTIONS,
  },
  { key: "nationalities", label: "Nationality", widget: "nationality", manatalId: "1742127", required: true },
  { key: "birth_date", label: "Date of Birth", widget: "date", manatalId: "1741686", required: true },
  {
    key: "gender",
    label: "Gender",
    widget: "select",
    manatalId: "1741687",
    required: true,
    placeholder: "Select gender",
    options: GENDER_OPTIONS,
  },
  { key: "religion", label: "Religion", widget: "text", manatalId: "1741695", required: true },
  {
    key: "nricfin",
    label: "NRIC/FIN",
    widget: "nricfin",
    manatalId: "1741696",
    placeholder: "e.g. S1234567A",
    description: "Singapore NRIC / FIN - 9 characters",
  },
  {
    key: "latest_degree",
    label: "Highest Qualification",
    widget: "select",
    manatalId: "1742501",
    required: true,
    placeholder: "Select highest qualification",
    options: QUALIFICATION_OPTIONS,
  },
  { key: "passportno", label: "Passport Number", widget: "text", manatalId: "1741699", required: true },
  {
    key: "placedateofissue",
    label: "Place & Date of Issue",
    widget: "text",
    manatalId: "1741700",
    required: true,
  },

  // Shown only when Residential Status is "Foreigner".
  {
    key: "workpermitpass",
    label: "Work Pass",
    widget: "select",
    manatalId: "1741698",
    placeholder: "Select work pass",
    options: WORK_PASS_OPTIONS.map((value) => ({ value, label: value })),
  },
  { key: "overseasaddress", label: "Overseas Address", widget: "text", manatalId: "1741691" },

  // 03 - Contact
  {
    key: "phone_number",
    label: "WhatsApp Number",
    widget: "phone",
    manatalId: "1741681",
    required: true,
    placeholder: "+65 9123 4567",
  },
  { key: "email", label: "Email", widget: "email", manatalId: "1741680", required: true },
  { key: "address", label: "Complete Address", widget: "text", manatalId: "1741690", required: true },
  {
    key: "postalcode",
    label: "Postal Code",
    widget: "postalcode",
    manatalId: "1741706",
    required: true,
    maxLength: 6,
  },

  // 04 - Emergency contact
  { key: "name", label: "Emergency Contact Name", widget: "text", manatalId: "1749464", required: true },
  {
    key: "relationship",
    label: "Emergency Contact Relationship",
    widget: "text",
    manatalId: "1749465",
    required: true,
  },
  {
    key: "address_b",
    label: "Emergency Contact Address",
    widget: "text",
    manatalId: "1749466",
    required: true,
  },
  {
    key: "mobilenumber",
    label: "Emergency Contact Mobile Number",
    widget: "phone",
    manatalId: "1749467",
    required: true,
  },
  {
    key: "hometelephonenumber",
    label: "Emergency Contact Home Telephone Number",
    widget: "phone",
    manatalId: "1749468",
  },
  {
    key: "officetelephonenumber",
    label: "Emergency Contact Office Telephone Number",
    widget: "phone",
    manatalId: "1749469",
  },
  {
    key: "emailaddress",
    label: "Emergency Contact Email Address",
    widget: "email",
    manatalId: "1749470",
    required: true,
  },

  // 06 - Other courses
  { key: "coursename", label: "Course Name", widget: "text", manatalId: "1742113" },
  { key: "coursestartdate", label: "Course Start Date", widget: "date", manatalId: "1742114" },
  {
    key: "expectedyearofcompletion",
    label: "Expected Year of Completion",
    widget: "digits",
    manatalId: "1742115",
    maxLength: 4,
  },

  // 08 - Additional information
  {
    key: "membershipsassociations",
    label: "Memberships & Associations",
    widget: "longtext",
    manatalId: "1741701",
  },
  {
    key: "description",
    label: "Briefly share your skills, experiences, and achievements beyond your resume",
    widget: "longtext",
    manatalId: "1741682",
  },
] as const satisfies readonly ApplicationField[];

export type ApplicationFieldKey = (typeof APPLICATION_FIELDS)[number]["key"];

const FIELDS_BY_KEY = new Map<string, ApplicationField>(APPLICATION_FIELDS.map((field) => [field.key, field]));

export function getApplicationField(key: ApplicationFieldKey): ApplicationField {
  const field = FIELDS_BY_KEY.get(key);

  // A typo here used to render nothing at all and leave the candidate with an
  // unsatisfiable error, so fail loudly instead.
  if (!field) throw new Error(`Unknown application field: ${key}`);

  return field;
}

/** Fields that carry a Manatal custom-field id, for building the payload. */
export const MANATAL_FIELDS = (APPLICATION_FIELDS as readonly ApplicationField[]).filter(
  (field): field is ApplicationField & { manatalId: string } => Boolean(field.manatalId),
);

/** One entry of Manatal's application-form response. */
export type ManatalLiveField = {
  id: string | number;
  slug?: string;
  name?: string;
  label?: string;
  /** Manatal's own type: char, longtext, integer, datetime, boolean. */
  type?: string;
};

const normalizeName = (value?: string | number | null) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Resolve a Manatal custom-field id from the list the ATS itself returned,
 * falling back to the id hardcoded above.
 *
 * The ids in this file were wrong for a long time and nothing caught it: the
 * date of birth was posted to the Gender field, which accepts any string, so
 * the payload was silently mis-filed rather than rejected. Manatal knows its
 * own ids and the apply page already fetches them for the education and
 * experience sections, so ask it rather than trusting this table.
 *
 * Matching is by slug first -- every scalar key here is also Manatal's slug --
 * then by label, because Resume, LinkedIn Profile URL, Educational Profile and
 * Experiences come back with no slug at all. The table stays as the fallback
 * for when that fetch fails and the list arrives empty, which must not stop a
 * candidate submitting.
 */
export function createManatalFieldLookup(live: readonly ManatalLiveField[]) {
  const byName = new Map<string, ManatalLiveField>();
  const byLabel = new Map<string, ManatalLiveField>();

  for (const field of live) {
    for (const name of [field.slug, field.name]) {
      if (name && !byName.has(normalizeName(name))) byName.set(normalizeName(name), field);
    }
    if (field.label && !byLabel.has(normalizeName(field.label))) byLabel.set(normalizeName(field.label), field);
  }

  return (slug: string, label?: string): ManatalLiveField | undefined =>
    byName.get(normalizeName(slug)) ?? (label ? byLabel.get(normalizeName(label)) : undefined);
}

export function createManatalIdResolver(live: readonly ManatalLiveField[]) {
  const lookup = createManatalFieldLookup(live);

  return (slug: string, label: string | undefined, fallback: string): string => {
    const field = lookup(slug, label);
    return field ? String(field.id) : fallback;
  };
}
