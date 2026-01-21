"use client";

import { industry_list } from "@/app/constants";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { formatReferencesToHTML, generateDeclarationList } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

interface JobDetail {
  id: number;
  position_name: string;
  location: string;
  employment_type: string;
  description: string;
  company?: { name: string };
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

const isCharacterReferenceField = (field: FormField) =>
  field.slug?.toLowerCase().includes("character") ||
  field.slug?.toLowerCase().includes("reference") ||
  field.name?.toLowerCase().includes("character") ||
  field.label?.toLowerCase().includes("character reference");

// ────────────────────────────────────────────────
// Helper to detect NRIC / FIN fields
// ────────────────────────────────────────────────
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
  const [nationalityQuery, setNationalityQuery] = useState("");
  const [nationalityOptions, setNationalityOptions] = useState<{ id: string; common_name: string; demonym: string }[]>(
    []
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
      [index]: {
        answer: value,
        details: value === "Yes" ? prev[index]?.details || "" : "",
      },
    }));
  };

  const handleDeclarationDetailsChange = (index: number, value: string) => {
    setDeclarationAnswers((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        details: value,
      },
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const jobRes = await fetch(`/api/jobs/${jobId}`);
        if (!jobRes.ok) throw new Error("Failed to fetch job");
        const jobData = await jobRes.json();
        setJob(jobData);

        const fieldsRes = await fetch(`/api/jobs/${jobId}/form-fields`);
        let fields = defaultFields;

        if (fieldsRes.ok) {
          const data = await fieldsRes.json();
          if (data.fields?.length > 0) {
            fields = data.fields;
          }
        }

        setFormFields(fields);

        console.log(
          "📋 Form fields loaded:",
          fields.map((f) => ({
            id: f.id,
            label: f.label,
            type: f.type,
            slug: f.slug,
            name: f.name,
          }))
        );

        const initialData: Record<string, string> = {};
        const initialCurrencies: Record<string, string> = {};

        fields.forEach((field) => {
          if (field.type !== "file") {
            const key = field.slug || field.name || field.id;
            initialData[key] = "";
            if (isExpectedSalary(field)) {
              initialCurrencies[field.id] = "SGD";
            }
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
      } catch (error) {
        setNationalityOptions([]);
        setShowNationalityOptions(false);
      } finally {
        setIsSearchingNationalities(false);
      }
    };

    const debounceTimer = setTimeout(fetchNationalities, 1500);

    return () => clearTimeout(debounceTimer);
  }, [nationalityQuery]);

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
    const map: Record<string, string> = {
      SGD: "11",
      USD: "1",
      EUR: "2",
      GBP: "3",
      PHP: "13",
    };
    return map[code] || "11";
  };

  const handleSimpleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSimpleFormData((prev) => ({ ...prev, [name]: value }));
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

  const isExperienceField = (f: FormField) =>
    (f.name || "").toLowerCase() === "experiences" ||
    (f.slug || "").toLowerCase() === "experiences" ||
    f.label?.toLowerCase() === "experiences" ||
    f.label?.toLowerCase() === "work experience";

  const [references, setReferences] = useState<CharacterReference[]>([
    { name: "", email: "", contact_no: "", company_occupation: "", relationship: "" },
  ]);

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

  const isEducationField = (f: FormField) =>
    (f.name || "").toLowerCase() === "education" ||
    (f.slug || "").toLowerCase() === "education" ||
    f.label?.toLowerCase() === "educational profile" ||
    f.label?.toLowerCase() === "education";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      const applicationData: Record<string, any> = {};

      const expField = formFields.find(isExperienceField);
      const eduField = formFields.find(isEducationField);

      let expectedCurrencyId: string | null = null;

      formFields.forEach((field) => {
        const key = field.slug || field.name || field.id;

        if (field.id === expField?.id || field.id === eduField?.id || isCVField(field)) {
          return;
        }

        const value = simpleFormData[key];
        let finalValue: string | number | null = "";

        if (value && typeof value === "string" && value.trim()) {
          finalValue = value.trim();

          if (isExpectedSalary(field)) {
            expectedCurrencyId = getCurrencyId(salaryCurrencies[field.id] || "SGD");
          }
        } else if (value) {
          finalValue = value as string;
        }

        applicationData[field.id] = finalValue;
      });

      if (expField) {
        const valid = experiences.filter((e) => e.title.trim() || e.employer.trim());
        applicationData[expField.id] = valid.map((exp) => {
          let cleanSalary: string | undefined;
          if (exp.salary?.trim()) {
            cleanSalary = exp.salary.trim().replace(/[^0-9]/g, "");
          }
          const data: any = {
            title: exp.title.trim(),
            employer: exp.employer.trim(),
            started_at: exp.started_at || null,
            ended_at: exp.ended_at || null,
            is_current_employer: exp.is_current_employer,
            description: exp.description.trim(),
          };

          if (cleanSalary) data.salary = cleanSalary;

          return data;
        });
      }

      const validReferences = references.filter((ref) => ref.name.trim() || ref.email.trim() || ref.contact_no.trim());

      if (validReferences.length > 0) {
        applicationData["1741707"] = formatReferencesToHTML(validReferences);
      }

      if (eduField) {
        const valid = educations.filter((e) => e.school.trim() || e.degree_name.trim());
        applicationData[eduField.id] = valid.map((edu) => ({
          school: edu.school.trim(),
          degree_name: edu.degree_name.trim(),
          specialization: edu.specialization?.trim() || "",
          started_at: edu.started_at || null,
          ended_at: edu.ended_at || null,
          location: edu.location.trim(),
          description: edu.description?.trim() || "",
        }));
      }

      if (resumeProps.successes.length > 0) {
        const resumeField = formFields.find(isCVField);
        if (resumeField) {
          applicationData[resumeField.id] = resumeProps.successes[0];
        }
      } else {
        const resumeField = formFields.find(isCVField);
        if (resumeField?.required || resumeField?.is_required) {
          throw new Error("Please upload a resume file");
        }
      }

      console.log("Application Data:", applicationData);

      formDataToSend.append("application_data", JSON.stringify(applicationData));
      formDataToSend.append("jobId", jobId);

      if (expectedCurrencyId) {
        formDataToSend.append("expected_currency", expectedCurrencyId);
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("API Error Response:", result);
        throw new Error(result.error || result.message || result.details || "Failed to submit application");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const key = field.slug || field.name || field.id;
    const isRequired = field.required || field.is_required || false;
    const common =
      "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

    // ────────────────────────────────────────────────
    // NRIC / FIN - Singapore Identification Number
    // ────────────────────────────────────────────────
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
              if (/^[STFGMstfgm]?[\d]{0,7}[A-Za-z]?$/i.test(value)) {
                setSimpleFormData((prev) => ({ ...prev, [key]: value }));
              }
            }}
            onKeyPress={(e) => {
              if (!/[STFGMstfgm0-9A-Za-z]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onBlur={(e) => {
              const cleaned = e.target.value.trim().toUpperCase();
              setSimpleFormData((prev) => ({ ...prev, [key]: cleaned }));
            }}
            placeholder={field.placeholder || "e.g. S1234567A or T9876543Z"}
            className={`${common} uppercase tracking-wider font-mono`}
            maxLength={9}
            title="Format: S/T/F/G/M + 7 digits + 1 uppercase letter (e.g. S1234567A)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Singapore NRIC / FIN (9 characters)
          </p>
        </div>
      );
    }

    // ────────────────────────────────────────────────
    // PHONE NUMBER
    // ────────────────────────────────────────────────
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
            if (!/[0-9\s+\-()]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          placeholder={field.placeholder || "+31 6 1234 5678"}
          className={common}
          maxLength={20}
        />
      );
    }

    // ────────────────────────────────────────────────
    // EXPECTED SALARY
    // ────────────────────────────────────────────────
    if (isExpectedSalary(field)) {
      return (
        <div className="flex gap-2">
          <select
            value={salaryCurrencies[field.id] || "SGD"}
            onChange={(e) => setSalaryCurrencies((prev) => ({ ...prev, [field.id]: e.target.value }))}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[90px]"
          >
            <option value="SGD">SGD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="PHP">PHP</option>
          </select>

          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            name={key}
            required={isRequired}
            value={(simpleFormData[key] as string) || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(val)) {
                handleSimpleChange(e);
              }
            }}
            onKeyPress={(e) => {
              if (!/[0-9.]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            placeholder="e.g. 5000 or 5500.50"
            className={`flex-1 ${common}`}
          />
        </div>
      );
    }

    // ────────────────────────────────────────────────
    // NATIONALITY
    // ────────────────────────────────────────────────
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
            placeholder={field.placeholder || "Start typing to search..."}
            className={common}
            autoComplete="off"
          />
          {isSearchingNationalities && <div className="p-2 text-sm text-gray-500">Searching...</div>}
          {showNationalityOptions && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
              {nationalityOptions.length > 0 ? (
                nationalityOptions.map((nat) => (
                  <li
                    key={nat.id}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onMouseDown={() => {
                      setSimpleFormData((prev) => ({ ...prev, [key]: nat.demonym }));
                      setNationalityQuery(nat.demonym);
                      setShowNationalityOptions(false);
                    }}
                  >
                    {nat.demonym}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500">No results found</li>
              )}
            </ul>
          )}
        </div>
      );
    }

    // ────────────────────────────────────────────────
    // INDUSTRY
    // ────────────────────────────────────────────────
    if (isIndustryField(field)) {
      return (
        <select
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          className={common}
        >
          <option value="">Select an industry</option>
          {industry_list.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))}
        </select>
      );
    }

    // ────────────────────────────────────────────────
    // FILE / RESUME
    // ────────────────────────────────────────────────
    if (field.type === "file" || isCVField(field)) {
      return (
        <Dropzone {...resumeProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      );
    }

    // ────────────────────────────────────────────────
    // TEXTAREA
    // ────────────────────────────────────────────────
    if (field.type === "textarea" || field.type === "longtext") {
      return (
        <textarea
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          placeholder={field.placeholder}
          rows={4}
          className={common}
        />
      );
    }

    // ────────────────────────────────────────────────
    // DROPDOWN
    // ────────────────────────────────────────────────
    if (field.type === "dropdown" && field.options) {
      return (
        <select
          name={key}
          required={isRequired}
          value={(simpleFormData[key] as string) || ""}
          onChange={handleSimpleChange}
          className={common}
        >
          <option value="">Select an option</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    // ────────────────────────────────────────────────
    // DEFAULT INPUT (with date detection)
    // ────────────────────────────────────────────────
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
        className={common}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const hasExp = formFields.some(isExperienceField);
  const hasEdu = formFields.some(isEducationField);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-6 border-b bg-gray-50">
            <h1 className="text-2xl md:text-3xl font-bold">Application</h1>
            <p className="mt-1 text-gray-600">
              {job?.position_name} • {job?.company?.name || "Company"}
            </p>
            <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
              ← Back to job
            </button>
          </div>

          {submitSuccess ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">Application Submitted!</h2>
              <p className="text-gray-600 mb-8">Thank you! We'll get back to you soon.</p>
              <button
                onClick={() => router.push("/Hero")}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Browse More Jobs
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}

              {/* ===== MAIN FORM FIELDS ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields
                  .filter((f) => !isExperienceField(f) && !isEducationField(f) && !isCharacterReferenceField(f))
                  .map((field) => (
                    <div key={field.id} className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                        {(field.required || field.is_required) && <span className="text-red-600 ml-1">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
              </div>

              {/* ===== DECLARATION SECTION ===== */}
              <div className="border rounded-xl p-6 bg-gray-50">
                <h3 className="text-xl font-bold mb-5">Declaration</h3>

                {declarationQuestions.map((question, i) => {
                  const current = declarationAnswers[i];

                  return (
                    <div key={i} className="mb-5">
                      <p className="text-gray-700 mb-2">
                        {i + 1}. {question} <span className="text-red-600">*</span>
                      </p>

                      <div className="flex gap-6 mb-2">
                        {["Yes", "No"].map((option) => (
                          <label key={option} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`declaration_${i}`}
                              value={option}
                              checked={current?.answer === option}
                              onChange={() => handleDeclarationChange(i, option as "Yes" | "No")}
                              required
                              className="accent-indigo-600"
                            />
                            {option}
                          </label>
                        ))}
                      </div>

                      {current?.answer === "Yes" && (
                        <textarea
                          required
                          rows={3}
                          placeholder="Please provide details..."
                          value={current.details || ""}
                          onChange={(e) => handleDeclarationDetailsChange(i, e.target.value)}
                          className="w-full mt-2 px-3 py-2 border rounded-lg"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ===== CHARACTER REFERENCES ===== */}
              <div className="border rounded-xl p-6 bg-gray-50">
                <h3 className="text-xl font-bold mb-5">Character References</h3>

                {references.map((ref, i) => (
                  <div key={i} className="mb-6 p-4 border rounded-lg bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => updateReference(i, "name", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={ref.email}
                        onChange={(e) => updateReference(i, "email", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Contact No.</label>
                      <input
                        type="text"
                        value={ref.contact_no}
                        onChange={(e) => updateReference(i, "contact_no", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Company & Occupation</label>
                      <input
                        type="text"
                        value={ref.company_occupation}
                        onChange={(e) => updateReference(i, "company_occupation", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Relationship to Applicant</label>
                      <input
                        type="text"
                        value={ref.relationship}
                        onChange={(e) => updateReference(i, "relationship", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    {references.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReference(i)}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addReference}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  + Add Reference
                </button>
              </div>

              {/* ===== WORK EXPERIENCE ===== */}
              {hasExp && (
                <div className="border rounded-xl p-6 bg-gray-50">
                  <h3 className="text-xl font-bold mb-5">Work Experience</h3>

                  {experiences.map((exp, i) => (
                    <div key={i} className="mb-6 p-5 border rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Job Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(i, "title", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Company</label>
                          <input
                            type="text"
                            value={exp.employer}
                            onChange={(e) => updateExperience(i, "employer", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Salary</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={exp.salary || ""}
                            onChange={(e) => {
                              if (/^\d*$/.test(e.target.value)) {
                                updateExperience(i, "salary", e.target.value);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="e.g. 5000"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exp.is_current_employer}
                            onChange={(e) => updateExperience(i, "is_current_employer", e.target.checked)}
                            className="mr-2"
                          />
                          <label className="text-sm">Currently working here</label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <input
                            type="date"
                            value={exp.started_at}
                            onChange={(e) => updateExperience(i, "started_at", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <input
                            type="date"
                            value={exp.ended_at || ""}
                            onChange={(e) => updateExperience(i, "ended_at", e.target.value)}
                            disabled={exp.is_current_employer}
                            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(i, "description", e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>

                      {experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(i)}
                          className="mt-3 text-red-600 hover:text-red-800 text-lg"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addExperience}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Experience
                  </button>
                </div>
              )}

              {/* ===== EDUCATION ===== */}
              {hasEdu && (
                <div className="border rounded-xl p-6 bg-gray-50">
                  <h3 className="text-xl font-bold mb-5">Education</h3>

                  {educations.map((edu, i) => (
                    <div key={i} className="mb-6 p-5 border rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">School</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateEducation(i, "school", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Degree</label>
                          <input
                            type="text"
                            value={edu.degree_name}
                            onChange={(e) => updateEducation(i, "degree_name", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Field of Study</label>
                          <input
                            type="text"
                            value={edu.specialization}
                            onChange={(e) => updateEducation(i, "specialization", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Location</label>
                          <input
                            type="text"
                            value={edu.location}
                            onChange={(e) => updateEducation(i, "location", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <input
                            type="date"
                            value={edu.started_at}
                            onChange={(e) => updateEducation(i, "started_at", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <input
                            type="date"
                            value={edu.ended_at || ""}
                            onChange={(e) => updateEducation(i, "ended_at", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={edu.description}
                          onChange={(e) => updateEducation(i, "description", e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>

                      {educations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(i)}
                          className="mt-3 text-red-600 hover:text-red-800 text-lg"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEducation}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Education
                  </button>
                </div>
              )}

              {/* ===== SUBMIT / CANCEL ===== */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1 py-3.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 font-semibold disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}