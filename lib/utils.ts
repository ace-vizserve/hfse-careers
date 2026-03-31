import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { JobApplicationFormValues } from "./validators/job-application";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export type ExperienceItem = FormValues["experiences"][number] & {
  other_allowances?: string;
  reason_for_leaving?: string;
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

const MANATAL_API_KEY = process.env.NEXT_PUBLIC_MANATAL_API_KEY;
const MANATAL_BASE_URL = "https://api.manatal.com/open/v3";

type JobMatch = {
  id: number;
  job: number;
  candidate: number;
  is_active: boolean;
  submitted_at: string | null;
  dropped_at: string | null;
};

type Candidate = {
  id: number;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  full_name?: string | null;
};

type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

async function manatalFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${MANATAL_API_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Manatal API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function getAllJobMatches(jobPk: number): Promise<JobMatch[]> {
  let url: string | null = `${MANATAL_BASE_URL}/jobs/${jobPk}/matches/?page_size=1500`;
  const all: JobMatch[] = [];

  while (url) {
    const data = (await manatalFetch<PaginatedResponse<JobMatch>>(url)) as PaginatedResponse<JobMatch>;
    all.push(...(data.results ?? []));
    url = data.next ?? null;
  }

  return all;
}

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function fullNameOfCandidate(candidate: Candidate) {
  const explicitFullName = normalize(candidate.full_name);
  if (explicitFullName) return explicitFullName;

  const explicitName = normalize(candidate.name);
  if (explicitName) return explicitName;

  return `${normalize(candidate.first_name)} ${normalize(candidate.last_name)}`.trim().replace(/\s+/g, " ");
}

async function searchCandidates(params: { email?: string; full_name?: string }): Promise<Candidate[]> {
  const url = new URL(`${MANATAL_BASE_URL}/candidates/`);

  if (params.email) url.searchParams.set("email", params.email);
  if (params.full_name) url.searchParams.set("full_name", params.full_name);

  const data = await manatalFetch<PaginatedResponse<Candidate>>(url.toString());
  return data.results ?? [];
}

async function findCandidateIdByEmailOrName(input: { email?: string; fullName?: string }): Promise<number | null> {
  const email = normalize(input.email);
  const fullName = normalize(input.fullName);

  if (email && fullName) {
    const candidates = await searchCandidates({
      email,
      full_name: fullName,
    });

    const exactMatch = candidates.find((c) => normalize(c.email) === email && fullNameOfCandidate(c) === fullName);

    if (exactMatch) return exactMatch.id;

    if (candidates.length === 1) return candidates[0].id;
  }

  if (email) {
    const candidates = await searchCandidates({ email });

    const exactEmailMatch = candidates.find((c) => normalize(c.email) === email);

    if (exactEmailMatch) return exactEmailMatch.id;
  }

  if (fullName) {
    const candidates = await searchCandidates({ full_name: fullName });

    const exactNameMatch = candidates.find((c) => fullNameOfCandidate(c) === fullName);

    if (exactNameMatch) return exactNameMatch.id;
  }

  return null;
}

export async function hasAlreadyAppliedToJob(input: { jobPk: number; email?: string; fullName?: string }) {
  const [matches, candidateId] = await Promise.all([
    getAllJobMatches(input.jobPk),
    findCandidateIdByEmailOrName({
      email: input.email,
      fullName: input.fullName,
    }),
  ]);

  if (!candidateId) {
    return {
      foundCandidate: false,
      candidateId: null,
      alreadyApplied: false,
      matchedApplication: null,
    };
  }

  const matchedApplication = matches.find((match) => match.candidate === candidateId);

  return {
    foundCandidate: true,
    candidateId,
    alreadyApplied: Boolean(matchedApplication),
    matchedApplication: matchedApplication ?? null,
  };
}

export function normalizeApplicationData(applicationData: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(applicationData).filter(([_, value]) => value !== "" && value !== null && value !== undefined),
  );
}
