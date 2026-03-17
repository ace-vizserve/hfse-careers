"use client";

import { entity_list, industry_list } from "@/app/constants";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { formatFamilyParticularsToHTML, formatReferencesToHTML, generateDeclarationList } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

interface JobDetail {
  id: number;
  position_name: string;
  location: string;
  employment_type: string;
  description: string;
  org_name?: string;
  org_logo?: string;
  org_website?: string;
}

interface FormField {
  id: string;
  slug?: string;
  name?: string;
  label: string;
  type: string;
  is_required?: boolean;
  required?: boolean;
  field_category?: string;
  options?: string[];
  placeholder?: string;
}

interface Experience {
  title: string;
  employer: string;
  salary?: string;
  started_at: string;
  ended_at?: string | null;
  is_current_employer: boolean;
  description: string;
}

interface Education {
  school: string;
  degree_name: string;
  specialization?: string;
  started_at: string;
  ended_at?: string | null;
  location: string;
  description?: string;
}

interface CharacterReference {
  name: string;
  email: string;
  contact_no: string;
  company_occupation: string;
  relationship: string;
}

interface FamilyMember {
  name: string;
  relationship: string;
  nationality: string;
  age: string;
  occupation: string;
  company: string;
}

const isCharacterReferenceField = (field: FormField) =>
  field.slug?.toLowerCase().includes("character") ||
  field.slug?.toLowerCase().includes("reference") ||
  field.name?.toLowerCase().includes("character") ||
  field.label?.toLowerCase().includes("character reference");

const isNricFinField = (field: FormField) =>
  field.slug?.toLowerCase()?.includes("nric") ||
  field.slug?.toLowerCase()?.includes("fin") ||
  field.name?.toLowerCase()?.includes("nric") ||
  field.name?.toLowerCase()?.includes("fin") ||
  field.label?.toLowerCase().includes("nric") ||
  field.label?.toLowerCase().includes("fin") ||
  field.label?.toLowerCase().includes("identification") ||
  field.label?.toLowerCase().includes("singapore id") ||
  field.label?.toLowerCase().includes("pink ic") ||
  field.label?.toLowerCase().includes("nrric");

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const resumeProps = useSupabaseUpload({
    bucketName: "candidate-resume",
    allowedMimeTypes: ["application/pdf"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 5,
  });

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [simpleFormData, setSimpleFormData] = useState<Record<string, string | File>>({});
  const [salaryCurrencies, setSalaryCurrencies] = useState<Record<string, string>>({});

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      title: "",
      employer: "",
      salary: "",
      started_at: "",
      ended_at: null,
      is_current_employer: false,
      description: "",
    },
  ]);

  const [educations, setEducations] = useState<Education[]>([
    { school: "", degree_name: "", specialization: "", started_at: "", ended_at: null, location: "", description: "" },
  ]);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { name: "", relationship: "", nationality: "", age: "", occupation: "", company: "" },
  ]);

  const [references, setReferences] = useState<CharacterReference[]>([
    { name: "", email: "", contact_no: "", company_occupation: "", relationship: "" },
  ]);

  const [nationalityQuery, setNationalityQuery] = useState("");
  const [nationalityOptions, setNationalityOptions] = useState<{ id: string; common_name: string; demonym: string }[]>(
    [],
  );
  const [isSearchingNationalities, setIsSearchingNationalities] = useState(false);
  const [showNationalityOptions, setShowNationalityOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultFields: FormField[] = [
    { id: "full_name", slug: "full_name", label: "Full Name", type: "text", required: true },
    { id: "email", slug: "email", label: "Email Address", type: "email", required: true },
    { id: "phone", slug: "phone", label: "Phone Number", type: "tel", required: true },
    { id: "nationality", slug: "nationality", label: "Nationality", type: "text", required: false },
    { id: "linkedin", slug: "linkedin", label: "LinkedIn Profile", type: "url", required: false },
    { id: "resume", slug: "resume", label: "Resume/CV", type: "file", required: true },
    { id: "cover_letter", slug: "cover_letter", label: "Cover Letter", type: "textarea", required: false },
  ];

  const declarationQuestions = [
    "Have you been or are you suffering from any disease/major medical condition/mental illness or physical impairment?",
    "Have you been discharged or dismissed from the service of your previous employers?",
    "Have you been convicted in a Court of law in any country or any ongoing legal proceedings?",
    "Have you been served with a Garnishee Order by any organisation or been declared a bankrupt?",
    "Have you any relatives and/or friends who have worked or are working in HFSE International School?",
  ];

  const [declarationAnswers, setDeclarationAnswers] = useState<
    Record<number, { answer: "Yes" | "No"; details?: string }>
  >({});

  const handleDeclarationChange = (index: number, value: "Yes" | "No") => {
    setDeclarationAnswers((prev) => ({
      ...prev,
      [index]: { answer: value, details: value === "Yes" ? prev[index]?.details || "" : "" },
    }));
  };

  const handleDeclarationDetailsChange = (index: number, value: string) => {
    setDeclarationAnswers((prev) => ({ ...prev, [index]: { ...prev[index], details: value } }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    setExperiences((prev) => prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)));
  };
  const addExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        title: "",
        employer: "",
        salary: "",
        started_at: "",
        ended_at: null,
        is_current_employer: false,
        description: "",
      },
    ]);
  };
  const removeExperience = (index: number) => {
    if (experiences.length <= 1) return;
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    setEducations((prev) => prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu)));
  };
  const addEducation = () => {
    setEducations((prev) => [
      ...prev,
      {
        school: "",
        degree_name: "",
        specialization: "",
        started_at: "",
        ended_at: null,
        location: "",
        description: "",
      },
    ]);
  };
  const removeEducation = (index: number) => {
    if (educations.length <= 1) return;
    setEducations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    setFamilyMembers((prev) => prev.map((member, i) => (i === index ? { ...member, [field]: value } : member)));
  };
  const addFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      { name: "", relationship: "", nationality: "", age: "", occupation: "", company: "" },
    ]);
  };
  const removeFamilyMember = (index: number) => {
    if (familyMembers.length <= 1) return;
    setFamilyMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateReference = (index: number, field: keyof CharacterReference, value: string) => {
    setReferences((prev) => prev.map((ref, i) => (i === index ? { ...ref, [field]: value } : ref)));
  };
  const addReference = () => {
    setReferences((prev) => [
      ...prev,
      { name: "", email: "", contact_no: "", company_occupation: "", relationship: "" },
    ]);
  };
  const removeReference = (index: number) => {
    if (references.length <= 1) return;
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const isExperienceField = (f: FormField) =>
    (f.name || "").toLowerCase() === "experiences" ||
    (f.slug || "").toLowerCase() === "experiences" ||
    f.label?.toLowerCase() === "experiences" ||
    f.label?.toLowerCase() === "work experience";

  const isEducationField = (f: FormField) =>
    (f.name || "").toLowerCase() === "education" ||
    (f.slug || "").toLowerCase() === "education" ||
    f.label?.toLowerCase() === "educational profile" ||
    f.label?.toLowerCase() === "education";

  const isHighestQualificationField = (f: FormField) =>
    (f.name || "").toLowerCase() === "experiences" ||
    (f.slug || "").toLowerCase() === "latest_degree" ||
    f.label?.toLowerCase() === "highest qualification" ||
    f.label?.toLowerCase() === "work experience";

  const isResidentialStatusField = (f: FormField) =>
    (f.name || "").toLowerCase() === "experiences" ||
    (f.slug || "").toLowerCase() === "residentialstatus" ||
    f.label?.toLowerCase() === "residential status" ||
    f.label?.toLowerCase() === "work experience";

  const isWorkPassField = (f: FormField) =>
    (f.name || "").toLowerCase() === "experiences" ||
    (f.slug || "").toLowerCase() === "workpermitpass" ||
    f.label?.toLowerCase() === "work pass" ||
    f.label?.toLowerCase() === "work experience";

  const isOverseasAddressField = (f: FormField) =>
    (f.name || "").toLowerCase() === "experiences" ||
    (f.slug || "").toLowerCase() === "overseasaddress" ||
    f.label?.toLowerCase() === "overseas address" ||
    f.label?.toLowerCase() === "work experience";

  const isExpectedSalary = (field: FormField) =>
    field.slug?.toLowerCase().includes("expected_salary") ||
    field.name?.toLowerCase().includes("expected_salary") ||
    field.slug?.toLowerCase().includes("expectedsalary") ||
    (field.label?.toLowerCase().includes("expected") && field.label?.toLowerCase().includes("salary"));

  const isNationalityField = (field: FormField) =>
    field.slug?.toLowerCase() === "nationality" ||
    field.name?.toLowerCase() === "nationality" ||
    field.label?.toLowerCase() === "nationality";

  const isIndustryField = (field: FormField) =>
    field.slug?.toLowerCase() === "industry" ||
    field.name?.toLowerCase() === "industries" ||
    field.label?.toLowerCase() === "Work Industry";

  const isCVField = (field: FormField) =>
    field.id === "1741683" ||
    field.slug?.toLowerCase() === "cv" ||
    field.slug?.toLowerCase() === "resume" ||
    field.name?.toLowerCase() === "cv" ||
    field.name?.toLowerCase() === "resume" ||
    field.label?.toLowerCase() === "cv" ||
    field.label?.toLowerCase() === "resume" ||
    field.label?.toLowerCase() === "resume/cv" ||
    field.label?.toLowerCase() === "upload resume";

  const getCurrencyId = (code: string) => {
    const map: Record<string, string> = { SGD: "11", USD: "1", EUR: "2", GBP: "3", PHP: "13" };
    return map[code] || "11";
  };

  const handleSimpleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSimpleFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const jobRes = await fetch(`/api/jobs/${jobId}`);
        if (!jobRes.ok) throw new Error("Failed to fetch job");
        const jobData = await jobRes.json();

        const organization = entity_list.find((org) => org.id === jobData.organization);

        if (organization) {
          jobData.org_name = organization.name;
          jobData.org_logo = organization.logo;
          jobData.org_website = organization.website;
          setJob(jobData);
        }

        const fieldsRes = await fetch(`/api/jobs/${jobId}/form-fields`);
        let fields = defaultFields;
        if (fieldsRes.ok) {
          const data = await fieldsRes.json();
          if (data.fields?.length > 0) fields = data.fields;
        }
        setFormFields(fields);

        const initialData: Record<string, string> = {};
        const initialCurrencies: Record<string, string> = {};
        fields.forEach((field) => {
          if (field.type !== "file") {
            const key = field.slug || field.name || field.id;
            initialData[key] = "";
            initialData["workpermitpass"] = "";
            initialData["overseasaddress"] = "";
            if (isExpectedSalary(field)) initialCurrencies[field.id] = "SGD";
          }
        });
        setSimpleFormData(initialData);
        setSalaryCurrencies(initialCurrencies);
      } catch (err) {
        setError("Failed to load application form");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  useEffect(() => {
    if (nationalityQuery.trim() === "") {
      setNationalityOptions([]);
      setShowNationalityOptions(false);
      return;
    }
    const fetchNationalities = async () => {
      setIsSearchingNationalities(true);
      try {
        const res = await fetch(`/api/nationalities/${nationalityQuery}`);
        if (res.ok) {
          const data = await res.json();
          setNationalityOptions(data.nationalities || []);
          setShowNationalityOptions(true);
        } else {
          setNationalityOptions([]);
          setShowNationalityOptions(false);
        }
      } catch {
        setNationalityOptions([]);
        setShowNationalityOptions(false);
      } finally {
        setIsSearchingNationalities(false);
      }
    };
    const debounceTimer = setTimeout(fetchNationalities, 1500);
    return () => clearTimeout(debounceTimer);
  }, [nationalityQuery]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formDataToSend = new FormData();
      const applicationData: Record<string, any> = {};
      let expectedCurrencyId: string | null = null;

      formFields.forEach((field) => {
        const key = field.slug || field.name || field.id;
        const value = simpleFormData[key];
        let finalValue: string | number | null = "";
        if (value && typeof value === "string" && value.trim()) {
          finalValue = value.trim();
          if (isExpectedSalary(field)) expectedCurrencyId = getCurrencyId(salaryCurrencies[field.id] || "SGD");
        } else if (value) {
          finalValue = value as string;
        }
        applicationData[field.id] = finalValue;
      });

      const trimmedFamilyMembers = familyMembers
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          relationship: m.relationship.trim(),
          nationality: m.nationality.trim(),
          age: m.age.trim(),
          occupation: m.occupation.trim(),
          company: m.company.trim(),
        }));

      applicationData["1741709"] = formatFamilyParticularsToHTML(trimmedFamilyMembers);
      applicationData["1771366"] = false;
      applicationData["1771465"] = false;
      applicationData["1771466"] = false;

      const validReferences = references.filter((ref) => ref.name.trim() || ref.email.trim() || ref.contact_no.trim());
      if (validReferences.length > 0) applicationData["1741707"] = formatReferencesToHTML(validReferences);
      applicationData["1741708"] = generateDeclarationList(declarationAnswers);

      if (resumeProps.successes.length > 0) {
        const resumeField = formFields.find(isCVField);
        if (resumeField) applicationData[resumeField.id] = resumeProps.successes[0];
      } else {
        const resumeField = formFields.find(isCVField);
        if (resumeField?.required || resumeField?.is_required) throw new Error("Please upload a resume file");
      }

      if ((simpleFormData["workpermitpass"] as string)?.trim()) {
        applicationData["1741698"] = (simpleFormData["workpermitpass"] as string).trim();
      }
      if ((simpleFormData["overseasaddress"] as string)?.trim()) {
        applicationData["1741691"] = (simpleFormData["overseasaddress"] as string).trim();
      }

      formDataToSend.append("application_data", JSON.stringify(applicationData));
      formDataToSend.append("jobId", jobId);
      if (expectedCurrencyId) formDataToSend.append("expected_currency", expectedCurrencyId);

      const response = await fetch("/api/applications", { method: "POST", body: formDataToSend });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || result.message || "Failed to submit application");
      }
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Shared input classes ───────────────────────────────────────────────────
  const inputBase =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all duration-200 " +
    "hover:border-slate-300 text-sm";

  const cardBase = "bg-white border border-slate-100 rounded-2xl shadow-sm";

  const renderField = (field: FormField) => {
    const key = field.slug || field.name || field.id;
    const isRequired = field.required || field.is_required || false;

    if (isNricFinField(field)) {
      return (
        <div className="relative">
          <input
            type="text"
            inputMode="text"
            pattern="[STFGMstfgm]\d{7}[A-Za-z]"
            name={key}
            required={isRequired}
            value={(simpleFormData[key] as string)?.toUpperCase() || ""}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[STFGMstfgm]?[\d]{0,7}[A-Za-z]?$/i.test(value))
                setSimpleFormData((prev) => ({ ...prev, [key]: value }));
            }}
            onKeyPress={(e) => {
              if (!/[STFGMstfgm0-9A-Za-z]/.test(e.key)) e.preventDefault();
            }}
            placeholder={field.placeholder || "e.g. S1234567A"}
            className={`${inputBase} uppercase tracking-widest font-mono`}
            maxLength={9}
          />
          <p className="mt-1.5 text-xs text-slate-400">Singapore NRIC / FIN — 9 characters</p>
        </div>
      );
    }

    if (key === "phone" || field.label?.toLowerCase().includes("phone")) {
      return (
        <input
          type="tel"
          inputMode="tel"
          pattern="[0-9\s\-\+\(\)]*"
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          onKeyPress={(e) => {
            if (!/[0-9\s+\-()]/.test(e.key)) e.preventDefault();
          }}
          placeholder={field.placeholder || "+65 9123 4567"}
          className={inputBase}
          maxLength={20}
        />
      );
    }

    if (isHighestQualificationField(field)) {
      return (
        <select
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          className={
            inputBase +
            " appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_14px_center]"
          }>
          <option value="">Select qualification</option>
          <option value="High School Diploma">High School Diploma</option>
          <option value="Associate's Degree">Associate's Degree</option>
          <option value="Bachelor's Degree">Bachelor's Degree</option>
          <option value="Master's Degree">Master's Degree</option>
          <option value="Doctorate">Doctorate</option>
        </select>
      );
    }

    if (isResidentialStatusField(field)) {
      const isForeigner = (simpleFormData[key] as string) === "Foreigner";

      return (
        <div className="md:col-span-2 space-y-5">
          <select
            name={key}
            required={isRequired}
            value={(simpleFormData[key] as string) || ""}
            onChange={handleSimpleChange}
            className={
              inputBase +
              " appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_14px_center]"
            }>
            <option value="">Select residential status</option>
            <option value="Singaporean">Singaporean</option>
            <option value="PR">PR</option>
            <option value="Foreigner">Foreigner</option>
          </select>

          {isForeigner && (
            <div className="grid gap-5 p-5 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-2.5 md:col-span-2 mb-1">
                <svg
                  className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-blue-600 font-medium">
                  Additional information required for foreign applicants
                </p>
              </div>

              {/* Work Pass */}
              <div>
                <Label required>Work Pass</Label>
                <select
                  name="workpermitpass"
                  required
                  value={(simpleFormData["workpermitpass"] as string) || ""}
                  onChange={handleSimpleChange}
                  className={
                    inputBase +
                    " appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_14px_center]"
                  }>
                  <option value="">Select work pass type</option>
                  <option value="Employment Pass">Employment Pass</option>
                  <option value="S Pass">S Pass</option>
                  <option value="Work Permit">Work Permit</option>
                  <option value="Dependant Pass">Dependant Pass</option>
                  <option value="Long Term Visit Pass">Long Term Visit Pass</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Overseas Address */}
              <div>
                <Label required>Overseas Address</Label>
                <input
                  type="text"
                  name="overseasaddress"
                  required
                  value={(simpleFormData["overseasaddress"] as string) || ""}
                  onChange={handleSimpleChange}
                  placeholder="Street, City, Country…"
                  className={inputBase}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isNationalityField(field)) {
      return (
        <div className="relative">
          <input
            type="text"
            name={key}
            required={isRequired}
            value={(simpleFormData[key] as string) || ""}
            onChange={(e) => {
              handleSimpleChange(e);
              setNationalityQuery(e.target.value);
            }}
            onFocus={() => nationalityOptions.length > 0 && setShowNationalityOptions(true)}
            onBlur={() => setTimeout(() => setShowNationalityOptions(false), 200)}
            placeholder={field.placeholder || "Start typing nationality…"}
            className={inputBase}
            autoComplete="off"
          />
          {isSearchingNationalities && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Searching…
            </div>
          )}
          {showNationalityOptions && (
            <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 max-h-56 overflow-y-auto shadow-xl">
              {nationalityOptions.length > 0 ? (
                nationalityOptions.map((nat) => (
                  <li
                    key={nat.id}
                    className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 text-sm text-slate-700 transition-colors"
                    onMouseDown={() => {
                      setSimpleFormData((prev) => ({ ...prev, [key]: nat.demonym }));
                      setNationalityQuery(nat.demonym);
                      setShowNationalityOptions(false);
                    }}>
                    {nat.demonym}
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-slate-400 text-sm">No results found</li>
              )}
            </ul>
          )}
        </div>
      );
    }

    if (isIndustryField(field)) {
      return (
        <select
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          className={inputBase}>
          <option value="">Select an industry</option>
          {industry_list.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "file" || isCVField(field)) {
      return (
        <div className="mt-1">
          <Dropzone {...resumeProps}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>
      );
    }

    if (field.type === "textarea" || field.type === "longtext") {
      return (
        <textarea
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          placeholder={field.placeholder}
          rows={4}
          className={inputBase + " resize-none"}
        />
      );
    }

    if (field.type === "dropdown" && field.options) {
      return (
        <select
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          className={inputBase}>
          <option value="">Select an option</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    const isDate =
      field.label?.toLowerCase().includes("date") ||
      field.label?.toLowerCase().includes("birth") ||
      field.name?.toLowerCase().includes("date");

    return (
      <input
        type={isDate ? "date" : field.type}
        name={key}
        required={isRequired}
        value={(simpleFormData[key] as string) || ""}
        onChange={handleSimpleChange}
        placeholder={field.placeholder}
        className={inputBase}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-slate-400 tracking-wide">Loading application…</p>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) => (
    <div className="flex items-start gap-4 mb-7">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
        <span className="text-white text-xs font-bold tracking-wider">{number}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-800 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );

  const AddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors py-2 px-3 rounded-lg hover:bg-blue-50">
      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-base leading-none">
        +
      </span>
      {label}
    </button>
  );

  const RemoveButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors py-1.5 px-2 rounded-lg hover:bg-rose-50">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Remove
    </button>
  );

  return (
    <>
      {/* Global style injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
        .radio-pill input[type="radio"] { display: none; }
        .radio-pill input[type="radio"]:checked + label { background-color: #7c3aed; color: white; border-color: #7c3aed; }
      `}</style>

      <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* ── Header Card ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                {/* 1. Category Badge */}
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md mb-4">
                  Job Application
                </div>

                {/* 2. Logo & Title Group */}
                <div className="flex items-center gap-4 mb-4">
                  {job?.org_logo ? (
                    <Image
                      height={40}
                      width={40}
                      src={job.org_logo}
                      alt={job.org_name ?? "Organization Logo"}
                      className="h-14 w-14 sm:h-16 sm:w-20 rounded-xl object-contain border border-slate-100 shadow-sm bg-white p-1.5 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl border border-slate-200 shrink-0">
                      {job?.org_name?.charAt(0) || "C"}
                    </div>
                  )}

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {job?.position_name || "Open Position"}
                  </h1>
                </div>

                {/* 3. Horizontal Metadata Row */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{job?.org_name || "Company"}</span>

                  {job?.org_website && (
                    <>
                      <span className="hidden sm:block text-slate-300">|</span>
                      <a
                        href={job.org_website}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                        Visit Website
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5">
                          <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </>
                  )}

                  {job?.location && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      {job.location}
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Action Area */}
              <div className="shrink-0">
                <button
                  onClick={() => router.back()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to listings
                </button>
              </div>
            </div>
          </div>

          {submitSuccess ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                <svg
                  className="w-10 h-10 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
              <p className="text-slate-500 mb-8 text-sm">
                Thank you for applying. We'll review your application and be in touch soon.
              </p>
              <button
                onClick={() => router.push("/Hero")}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-200">
                Browse More Jobs
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3 text-sm">
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* ── Section 1: Personal Information ─────── */}
              <div className={`${cardBase} p-8`}>
                <SectionHeader number="01" title="Personal Information" subtitle="Basic details about you" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {formFields
                    .filter(
                      (f) =>
                        !isExperienceField(f) &&
                        !isEducationField(f) &&
                        !isCharacterReferenceField(f) &&
                        !isWorkPassField(f) &&
                        !isOverseasAddressField(f),
                    )
                    .map((field) => (
                      <div
                        key={field.id}
                        className={
                          field.type === "file" || isCVField(field) || field.type === "textarea" ? "md:col-span-2" : ""
                        }>
                        <Label required={field.required || field.is_required}>{field.label}</Label>
                        {renderField(field)}
                      </div>
                    ))}
                </div>
              </div>

              {/* ── Section 2: Work Experience ─────── */}
              <div className={`${cardBase} p-8`}>
                <SectionHeader
                  number="02"
                  title="Work Experience"
                  subtitle="Your employment history, most recent first"
                />
                <div className="space-y-4">
                  {experiences.map((exp, i) => (
                    <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Experience {i + 1}
                        </span>
                        {experiences.length > 1 && <RemoveButton onClick={() => removeExperience(i)} />}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label required>Job Title</Label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(i, "title", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. Senior Software Engineer"
                          />
                        </div>
                        <div>
                          <Label required>Employer</Label>
                          <input
                            type="text"
                            value={exp.employer}
                            onChange={(e) => updateExperience(i, "employer", e.target.value)}
                            className={inputBase}
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <Label>Salary</Label>
                          <input
                            type="text"
                            value={exp.salary || ""}
                            onChange={(e) => updateExperience(i, "salary", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. SGD 5,000 / month"
                          />
                        </div>
                        <div>
                          <Label required>Start Date</Label>
                          <input
                            type="date"
                            value={exp.started_at}
                            onChange={(e) => updateExperience(i, "started_at", e.target.value)}
                            className={inputBase}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <input
                            type="date"
                            value={exp.ended_at || ""}
                            onChange={(e) => updateExperience(i, "ended_at", e.target.value)}
                            disabled={exp.is_current_employer}
                            className={inputBase + (exp.is_current_employer ? " opacity-40 cursor-not-allowed" : "")}
                          />
                        </div>
                        <div className="flex items-center">
                          <label
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none w-full
              ${
                exp.is_current_employer
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}>
                            <input
                              type="checkbox"
                              checked={exp.is_current_employer}
                              onChange={(e) => updateExperience(i, "is_current_employer", e.target.checked)}
                              className="sr-only"
                            />
                            {exp.is_current_employer ? (
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <span className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                            )}
                            Current employer
                          </label>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(i, "description", e.target.value)}
                            rows={3}
                            placeholder="Key responsibilities and achievements…"
                            className={inputBase + " resize-none"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <AddButton onClick={addExperience} label="Add Experience" />
                </div>
              </div>

              {/* ── Section 3: Education ─────── */}
              <div className={`${cardBase} p-8`}>
                <SectionHeader number="03" title="Education" subtitle="Your academic background and qualifications" />
                <div className="space-y-4">
                  {educations.map((edu, i) => (
                    <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Education {i + 1}
                        </span>
                        {educations.length > 1 && <RemoveButton onClick={() => removeEducation(i)} />}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label required>School / Institution</Label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateEducation(i, "school", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. National University of Singapore"
                          />
                        </div>
                        <div>
                          <Label required>Degree / Qualification</Label>
                          <input
                            type="text"
                            value={edu.degree_name}
                            onChange={(e) => updateEducation(i, "degree_name", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. Bachelor of Science"
                          />
                        </div>
                        <div>
                          <Label>Specialization / Major</Label>
                          <input
                            type="text"
                            value={edu.specialization || ""}
                            onChange={(e) => updateEducation(i, "specialization", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. Computer Science"
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <input
                            type="text"
                            value={edu.location}
                            onChange={(e) => updateEducation(i, "location", e.target.value)}
                            className={inputBase}
                            placeholder="City, Country"
                          />
                        </div>
                        <div>
                          <Label required>Start Date</Label>
                          <input
                            type="date"
                            value={edu.started_at}
                            onChange={(e) => updateEducation(i, "started_at", e.target.value)}
                            className={inputBase}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <input
                            type="date"
                            value={edu.ended_at || ""}
                            onChange={(e) => updateEducation(i, "ended_at", e.target.value)}
                            className={inputBase}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <textarea
                            value={edu.description || ""}
                            onChange={(e) => updateEducation(i, "description", e.target.value)}
                            rows={3}
                            placeholder="Achievements, honours, extracurriculars…"
                            className={inputBase + " resize-none"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <AddButton onClick={addEducation} label="Add Education" />
                </div>
              </div>

              {/* ── Section 4: Family Particulars ───────── */}
              <div className={`${cardBase} p-8`}>
                <SectionHeader number="04" title="Family Particulars" subtitle="Details of immediate family members" />
                <div className="space-y-4">
                  {familyMembers.map((member, i) => (
                    <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Member {i + 1}
                        </span>
                        {familyMembers.length > 1 && <RemoveButton onClick={() => removeFamilyMember(i)} />}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label>Name</Label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateFamilyMember(i, "name", e.target.value)}
                            className={inputBase}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <input
                            type="text"
                            value={member.relationship}
                            onChange={(e) => updateFamilyMember(i, "relationship", e.target.value)}
                            className={inputBase}
                            placeholder="Father / Spouse / Child…"
                          />
                        </div>
                        <div>
                          <Label>Nationality</Label>
                          <input
                            type="text"
                            value={member.nationality}
                            onChange={(e) => updateFamilyMember(i, "nationality", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. Singaporean"
                          />
                        </div>
                        <div>
                          <Label>Age</Label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={member.age}
                            onChange={(e) => {
                              if (/^\d*$/.test(e.target.value)) updateFamilyMember(i, "age", e.target.value);
                            }}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) e.preventDefault();
                            }}
                            className={inputBase}
                            placeholder="e.g. 45"
                          />
                        </div>
                        <div>
                          <Label>Occupation</Label>
                          <input
                            type="text"
                            value={member.occupation}
                            onChange={(e) => updateFamilyMember(i, "occupation", e.target.value)}
                            className={inputBase}
                            placeholder="Job title or role"
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <input
                            type="text"
                            value={member.company}
                            onChange={(e) => updateFamilyMember(i, "company", e.target.value)}
                            className={inputBase}
                            placeholder="Employer (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <AddButton onClick={addFamilyMember} label="Add Family Member" />
                </div>
              </div>

              {/* ── Section 5: Declaration ───────────────── */}
              <div className={`${cardBase} p-8`}>
                <SectionHeader
                  number="05"
                  title="Declaration"
                  subtitle="Please answer all questions honestly. All information is kept confidential."
                />
                <div className="space-y-6">
                  {declarationQuestions.map((question, i) => {
                    const current = declarationAnswers[i];
                    return (
                      <div key={i} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                        <p className="text-sm text-slate-700 mb-3 leading-relaxed font-medium">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold mr-2.5">
                            {i + 1}
                          </span>
                          {question}
                          <span className="text-rose-400 ml-1">*</span>
                        </p>
                        <div className="flex gap-3">
                          {["Yes", "No"].map((option) => (
                            <label
                              key={option}
                              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none
                                ${
                                  current?.answer === option
                                    ? option === "Yes"
                                      ? "border-amber-400 bg-amber-50 text-amber-700"
                                      : "border-emerald-400 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                }`}>
                              <input
                                type="radio"
                                name={`declaration_${i}`}
                                value={option}
                                checked={current?.answer === option}
                                onChange={() => handleDeclarationChange(i, option as "Yes" | "No")}
                                required
                                className="sr-only"
                              />
                              {current?.answer === option && (
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              {option}
                            </label>
                          ))}
                        </div>
                        {current?.answer === "Yes" && (
                          <div className="mt-3">
                            <textarea
                              required
                              rows={3}
                              placeholder="Please provide details…"
                              value={current.details || ""}
                              onChange={(e) => handleDeclarationDetailsChange(i, e.target.value)}
                              className={`${inputBase} resize-none`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Section 6: Character References ─────── */}
              <div className={`${cardBase} p-8`}>
                <SectionHeader
                  number="06"
                  title="Character References"
                  subtitle="People who can vouch for your professional character"
                />
                <div className="space-y-4">
                  {references.map((ref, i) => (
                    <div key={i} className="relative p-6 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Reference {i + 1}
                        </span>
                        {references.length > 1 && <RemoveButton onClick={() => removeReference(i)} />}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <input
                            type="text"
                            value={ref.name}
                            onChange={(e) => updateReference(i, "name", e.target.value)}
                            className={inputBase}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <input
                            type="email"
                            value={ref.email}
                            onChange={(e) => updateReference(i, "email", e.target.value)}
                            className={inputBase}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <Label>Contact Number</Label>
                          <input
                            type="text"
                            value={ref.contact_no}
                            onChange={(e) => updateReference(i, "contact_no", e.target.value)}
                            className={inputBase}
                            placeholder="+65 9123 4567"
                          />
                        </div>
                        <div>
                          <Label>Company & Occupation</Label>
                          <input
                            type="text"
                            value={ref.company_occupation}
                            onChange={(e) => updateReference(i, "company_occupation", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. Acme Corp, Senior Manager"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Relationship to Applicant</Label>
                          <input
                            type="text"
                            value={ref.relationship}
                            onChange={(e) => updateReference(i, "relationship", e.target.value)}
                            className={inputBase}
                            placeholder="e.g. Former Supervisor, Colleague"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <AddButton onClick={addReference} label="Add Reference" />
                </div>
              </div>

              {/* ── Submit Bar ──────────────────────────── */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-sm text-slate-400">
                  By submitting, you confirm all information provided is accurate.
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={submitting}
                    className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm shadow-blue-200">
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowUpRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
