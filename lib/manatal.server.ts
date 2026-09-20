/**
 * Server-only Manatal lookups.
 *
 * These used to live in `lib/utils.ts` and ran in the browser against
 * `NEXT_PUBLIC_MANATAL_API_KEY`, which shipped the API key in the client bundle
 * and put a third-party host on the critical submit path. They now run on the
 * server with the private key, behind `/api/applications/check-duplicate`.
 */

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
  const apiKey = process.env.MANATAL_API_KEY;

  if (!apiKey) {
    throw new Error("MANATAL_API_KEY is not configured");
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${apiKey}`,
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
  // Look the candidate up first. Most applicants are new, and in that case the
  // job's match list — which pages through every match on the job — is never
  // worth fetching.
  const candidateId = await findCandidateIdByEmailOrName({
    email: input.email,
    fullName: input.fullName,
  });

  if (!candidateId) {
    return {
      foundCandidate: false,
      candidateId: null,
      alreadyApplied: false,
      matchedApplication: null,
    };
  }

  const matches = await getAllJobMatches(input.jobPk);
  const matchedApplication = matches.find((match) => match.candidate === candidateId);

  return {
    foundCandidate: true,
    candidateId,
    alreadyApplied: Boolean(matchedApplication),
    matchedApplication: matchedApplication ?? null,
  };
}
