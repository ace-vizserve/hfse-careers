export interface Job {
  id?: number;
  position_name?: string;
  title?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  employment_type?: string;
  contract_details?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  frequency?: string;
  is_remote?: boolean | null;
  company?: { name: string };
  organization?: number;
  created_at?: string;
  requirements?: string[];
  benefits?: string[];
  urgently_hiring?: boolean;
  easily_apply?: boolean;
  org_logo: string;
  org_name: string;
  org_website: string;
}

/** What `/jobs/[id]` renders. Manatal returns more than this; these are the fields we use. */
export interface JobDetail {
  id: number;
  position_name: string;
  /** Manatal leaves this null in practice; read city/country instead. */
  location?: string;
  city?: string;
  country?: string;
  is_remote?: boolean | null;
  employment_type: string;
  contract_details?: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  frequency?: string;
  company?: { name: string };
  organization?: number;
  date_posted?: string;
  valid_through?: string;
  created_at?: string;
  updated_at?: string;
  org_logo?: string;
  org_name?: string;
  org_website?: string;
}
