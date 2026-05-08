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
  requirements?: string[];
  benefits?: string[];
  urgently_hiring?: boolean;
  easily_apply?: boolean;
  org_logo: string;
  org_name: string;
  org_website: string;
}
