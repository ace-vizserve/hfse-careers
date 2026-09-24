import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { JobDetail } from "./types/job";
import { JobApplicationFormValues } from "./validators/job-application";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Where the role is. Manatal returns `city` and `country` and leaves
 * `location` null on every posting we have, so reading `location` alone left
 * both the page and its JobPosting with no location at all -- and a JobPosting
 * without one is not eligible for Google's job results.
 */
export function jobLocation(job: JobDetail) {
  if (job.is_remote) return "Remote";

  const parts = [job.city, job.country].filter(Boolean);
  const unique = [...new Set(parts)];

  return unique.join(", ") || job.location || "";
}

export function formatEmploymentType(contractDetails?: string, employmentType?: string, fallback = "Full-Time") {
  if (contractDetails) {
    return contractDetails
      .replace(/_/g, "-")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("-");
  }
  return employmentType || fallback;
}

export type JobDescriptionSection =
  | { type: "header"; header: string; items: string[] }
  | { type: "text"; text: string };

export function parseJobDescription(description: string): JobDescriptionSection[] {
  const text = description.replace(/<[^>]*>/g, "");
  const sections = text.split(/(?=JOB QUALIFICATIONS:|JOB DETAILS:)/);

  return sections.flatMap<JobDescriptionSection>((section) => {
    if (!section.trim()) return [];

    if (section.startsWith("JOB QUALIFICATIONS:") || section.startsWith("JOB DETAILS:")) {
      const headerMatch = section.match(/^(JOB QUALIFICATIONS:|JOB DETAILS:)/);
      const header = headerMatch ? headerMatch[0] : "";
      const content = section.replace(header, "").trim();
      const items = content
        .split(/(?=[A-Z][a-z]{2,})/)
        .map((item) => item.trim())
        .filter((item) => item.split(/\s+/).length >= 5);
      return [{ type: "header", header, items }];
    }

    return [{ type: "text", text: section }];
  });
}

type FormValues = JobApplicationFormValues & Record<string, any>;

type EducationPayloadItem = {
  school: string;
  school_error: string;
  degree_name: string;
  degree_name_error: string;
  specialization: string;
  started_at: string | null;
  ended_at: string | null;
  start_at: string | null;
  end_at: string | null;
  final_grade: string | null;
  score_type: string | null;
  location: string;
  status: number;
  description: string;
};

type EducationFormItem = FormValues["educations"][number] & {
  final_grade?: string | null;
  score_type?: string | null;
  status?: number;
};

export const formatEducations = (educations: EducationFormItem[]): EducationPayloadItem[] => {
  return educations
    .filter(
      (edu) =>
        edu.school?.trim() ||
        edu.degree_name?.trim() ||
        edu.specialization?.trim() ||
        edu.started_at?.trim() ||
        edu.ended_at?.trim() ||
        edu.location?.trim() ||
        edu.description?.trim(),
    )
    .map((edu) => {
      const startedAt = edu.started_at?.trim() || null;
      const endedAt = edu.ended_at?.trim() || null;

      return {
        school: edu.school?.trim() || "",
        school_error: "",
        degree_name: edu.degree_name?.trim() || "",
        degree_name_error: "",
        specialization: edu.specialization?.trim() || "",
        started_at: startedAt,
        ended_at: endedAt,
        start_at: startedAt,
        end_at: endedAt,
        final_grade: edu.final_grade?.trim() || null,
        score_type: edu.score_type?.trim() || null,
        location: edu.location?.trim() || "",
        status: typeof edu.status === "number" ? edu.status : 1,
        description: edu.description?.trim() || "",
      };
    });
};

type ExperiencePayloadItem = {
  title: string;
  employer: string;
  salary: string;
  currency_code: string;
  frequency: string;
  started_at: string | null;
  ended_at: string | null;
  start_at: string | null;
  end_at: string | null;
  is_current_employer: boolean;
  location: string;
  description: string;
};

type ExperienceFormItem = FormValues["experiences"][number] & {
  currency_code?: string;
  frequency?: string;
  location?: string;
  other_allowances?: string;
  reason_for_leaving?: string;
};

export const formatExperiences = (experiences: ExperienceFormItem[]): ExperiencePayloadItem[] => {
  return experiences
    .filter(
      (exp) =>
        exp.title?.trim() ||
        exp.employer?.trim() ||
        exp.salary?.trim() ||
        exp.started_at?.trim() ||
        exp.ended_at?.trim() ||
        exp.description?.trim() ||
        exp.location?.trim() ||
        exp.other_allowances?.trim() ||
        exp.reason_for_leaving?.trim(),
    )
    .map((exp) => {
      const descriptionParts = [
        exp.description?.trim(),
        exp.other_allowances?.trim() ? `Other Allowances: ${exp.other_allowances.trim()}` : "",
        exp.reason_for_leaving?.trim() ? `Reason for Leaving: ${exp.reason_for_leaving.trim()}` : "",
      ].filter(Boolean);

      const startedAt = exp.started_at?.trim() || null;
      const endedAt = exp.is_current_employer ? null : exp.ended_at?.trim() || null;

      return {
        title: exp.title?.trim() || "",
        employer: exp.employer?.trim() || "",
        salary: exp.salary?.trim() || "",
        currency_code: exp.currency_code?.trim() || "",
        frequency: exp.frequency?.trim() || "",
        started_at: startedAt,
        ended_at: endedAt,
        start_at: startedAt,
        end_at: endedAt,
        is_current_employer: !!exp.is_current_employer,
        location: exp.location?.trim() || "",
        description: descriptionParts.join(" | "),
      };
    });
};

type Reference = {
  name: string;
  email: string;
  contact_no: string;
  company_occupation: string;
  relationship: string;
  years_known: string;
  is_work_related: "Yes" | "No";
  consent_to_contact: "I agree" | "I don't agree";
};

export function formatReferencesToHTML(refs: Reference[]): string {
  return `<ol>${refs
    .map(
      (ref) =>
        `<li><ul><li>Name : ${ref.name}</li><li>Email : ${ref.email}</li><li>Contact Number : ${ref.contact_no}</li><li>Occupation & Company : ${ref.company_occupation}</li><li>Relationship to Applicant : ${ref.relationship}</li><li>Years Known : ${ref.years_known}</li><li>Work-related Reference : No</li><li>Reference Consent : ${ref.consent_to_contact}</li></ul></li>`,
    )
    .join("")}</ol>`;
}

type FamilyParticulars = {
  name: string;
  nationality: string;
  age: string;
  occupation: string;
  company: string;
  relationship: string;
};

export function formatFamilyParticularsToHTML(refs: FamilyParticulars[]): string {
  return `
<ol>
  ${refs
    .map(
      (ref) => `
    <li>
      <ul>
        <li><strong>Name:</strong> ${ref.name}</li>
        <li><strong>Relationship:</strong> ${ref.relationship}</li>
        <li><strong>Nationality:</strong> ${ref.nationality}</li>
        <li><strong>Age:</strong> ${ref.age}</li>
        <li><strong>Occupation:</strong> ${ref.occupation}</li>
        <li><strong>Company:</strong> ${ref.company}</li>
      </ul>
    </li>
  `,
    )
    .join("")}
</ol>
`.trim();
}

type DeclarationAnswer = {
  answer: "Yes" | "No";
  details?: string;
};

export function generateDeclarationList(declarations: Record<number, DeclarationAnswer>): string {
  const declarationQuestions = [
    "Have you been or are you suffering from any disease/major medical condition/mental illness or physical impairment?",
    "Have you been discharged or dismissed from the service of your previous employers?",
    "Have you been convicted in a Court of law in any country or any ongoing legal proceedings?",
    "Have you been served with a Garnishee Order by any organisation or been declared a bankrupt?",
    "Have you any relatives and/or friends who have worked or are working in HFSE International School?",
  ];

  return `
<ol>
  ${declarationQuestions
    .map((question, idx) => {
      const data = declarations[idx];

      return `
    <li>
      ${question}
      <ul>
        <li><strong>Answer:</strong> ${data?.answer || "-"}</li>
        ${data?.answer === "Yes" && data.details?.trim() ? `<li><strong>Details:</strong> ${data.details}</li>` : ""}
      </ul>
    </li>
  `;
    })
    .join("")}
</ol>
`.trim();
}

/**
 * Pull the readable sentences out of a Manatal error body.
 *
 * A rejected application used to reach the candidate verbatim, so the toast
 * read `{"application_data":["Field Expected Salary should be a numerical
 * value and be less than 11 digits"]}`. Manatal nests its messages differently
 * depending on what failed -- a bare `detail` string for missing fields, an
 * array under the offending key for a bad value -- so collect every string in
 * the body rather than reaching for one shape.
 */
export function readManatalError(body: string): string | undefined {
  let parsed: unknown;

  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }

  const messages: string[] = [];

  const collect = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed && !messages.includes(trimmed)) messages.push(trimmed);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(collect);
    }
  };

  collect(parsed);

  if (messages.length === 0) return undefined;

  // Manatal does not punctuate, and several messages run together unreadably.
  return messages.map((message) => (/[.!?]$/.test(message) ? message : `${message}.`)).join(" ");
}

export function normalizeApplicationData(applicationData: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(applicationData).filter(([_, value]) => value !== "" && value !== null && value !== undefined),
  );
}
