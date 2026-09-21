"use client";

import { entity_list } from "@/app/constants";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { ApplicationNote } from "@/components/ui/application-note";
import { ConsentDeclarations } from "@/components/ui/consent-declarations";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { useApplicationFormStore } from "@/lib/stores/application-form-store";
import { DatePicker } from "@/components/ui/date-picker";
import { ErrorSummary, type ErrorSummaryItem } from "@/components/ui/error-summary";
import { IndustryCombobox } from "@/components/ui/industry-combo-box";
import { NationalityCombobox } from "@/components/ui/nationality-combo-box";
import { ScrollToSubmitButton } from "@/components/ui/scroll-to-submit-button";
import { StyledSelect } from "@/components/ui/styled-select";
import { SubmittingOverlay } from "@/components/ui/submitting-overlay";
import { usePreventRefresh } from "@/hooks/use-prevent-refresh";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import {
  formatEducations,
  formatExperiences,
  formatFamilyParticularsToHTML,
  formatReferencesToHTML,
  generateDeclarationList,
} from "@/lib/utils";
import { JobApplicationFormValues, jobApplicationSchema } from "@/lib/validators/job-application";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Controller, FieldErrors, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { sileo } from "sileo";

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
  id: string | number;
  slug?: string;
  name?: string;
  label: string;
  type: string;
  is_required?: boolean;
  isrequired?: boolean;
  required?: boolean;
  field_category?: string;
  fieldcategory?: string;
  display_type?: string;
  displaytype?: string;
  choices?: string[];
  options?: string[];
  placeholder?: string;
}

type FormValues = JobApplicationFormValues & Record<string, any>;

const declarationQuestions = [
  "Have you been or are you suffering from any disease/major medical condition/mental illness or physical impairment?",
  "Have you been discharged or dismissed from the service of your previous employers?",
  "Have you been convicted in a Court of law in any country or any ongoing legal proceedings?",
  "Have you been served with a Garnishee Order by any organisation or been declared a bankrupt?",
  "Have you any relatives and/or friends who have worked or are working in HFSE International School?",
] as const;

const normalize = (value?: string | number | null) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getFieldKey = (field: FormField) => String(field.slug || field.name || field.id);
const getRequired = (field: FormField) => Boolean(field.required ?? field.isrequired ?? field.is_required);
const getCategory = (field: FormField) => field.fieldcategory || field.field_category || "";
const getDisplayType = (field: FormField) => field.displaytype || field.display_type || "";
const getChoices = (field: FormField) => field.choices || field.options || [];

const matches = (field: FormField, ...values: string[]) => {
  const pool = [
    normalize(field.slug),
    normalize(field.name),
    normalize(field.label),
    normalize(getCategory(field)),
    normalize(getDisplayType(field)),
    normalize(field.type),
    normalize(field.id),
  ];

  return values.some((value) => {
    const target = normalize(value);
    return pool.some((item) => item === target);
  });
};

const isNricFinField = (field: FormField) =>
  matches(field, "nricfin", "nric", "fin", "singapore id", "pink ic", "identification");

const workPassOptions = [
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

const buildDefaultValues = (): FormValues => ({
  expected_salary: "",
  expected_salary_currency: "SGD",
  linkedin: "",
  industries: [],
  years_of_experience: "",
  resume: "",

  is_referred: false,
  referrer_details: {
    referrer_name: "",
    referrer_email: "",
  },

  is_applying_for_teacher: false,
  preferredsubjectsandlevels: "",

  full_name: "",
  preferredname: "",
  residentialstatus: "" as never,
  nationalities: "",
  birth_date: "",
  gender: "",
  religion: "",
  nricfin: "",
  latest_degree: "",
  passportno: "",
  placedateofissue: "",

  phone_number: "",
  email: "",
  address: "",
  postalcode: "",
  overseasaddress: "",
  workpermitpass: "",

  name: "",
  relationship: "",
  address_b: "",
  mobilenumber: "",
  hometelephonenumber: "",
  officetelephonenumber: "",
  emailaddress: "",

  family_members: [
    {
      name: "",
      relationship: "",
      nationality: "",
      age: "",
      occupation: "",
      company: "",
    },
  ],

  educations: [
    {
      school: "",
      degree_name: "",
      specialization: "",
      started_at: "",
      ended_at: null,
      location: "",
      description: "",
    },
  ],

  coursename: "",
  coursestartdate: "",
  expectedyearofcompletion: "",

  experiences: [
    {
      title: "",
      employer: "",
      salary: "",
      started_at: "",
      ended_at: null,
      is_current_employer: false,
      other_allowances: "",
      description: "",
      reason_for_leaving: "",
    },
  ],

  membershipsassociations: "",
  description: "",

  declarations: declarationQuestions.map(() => ({
    answer: "No" as const,
    details: "",
  })),

  references: [
    {
      name: "",
      email: "",
      contact_no: "",
      company_occupation: "",
      relationship: "",
      is_work_related: "No",
      years_known: "",
      consent_to_contact: "I agree",
    },
  ],

  skipbackgroundcheck: false,
  rcbcrequestissued: false,
  bcrequestissued: false,
});

/**
 * The four wizard steps, and which schema fields each one owns. Continue runs
 * `trigger()` against the active step's list, so a step cannot be left behind
 * in an invalid state.
 */
const STEPS: StepperStep[] = [
  { id: "about", title: "About You", description: "Details & contact" },
  { id: "background", title: "Family & Education", description: "Family & schooling" },
  { id: "experience", title: "Experience", description: "Work history" },
  { id: "declarations", title: "Declarations", description: "Declare & confirm" },
];

const STEP_SUMMARY = [
  "Application details, resume, personal information, contact and emergency contact",
  "Family particulars, educational profile and other courses",
  "Employment history and additional information",
  "Declaration questions and character references",
];

const STEP_FIELDS: (keyof JobApplicationFormValues)[][] = [
  [
    "expected_salary",
    "expected_salary_currency",
    "linkedin",
    "industries",
    "years_of_experience",
    "resume",
    "is_referred",
    "referrer_details",
    "is_applying_for_teacher",
    "preferredsubjectsandlevels",
    "full_name",
    "preferredname",
    "residentialstatus",
    "nationalities",
    "birth_date",
    "gender",
    "religion",
    "nricfin",
    "latest_degree",
    "passportno",
    "placedateofissue",
    "phone_number",
    "email",
    "address",
    "postalcode",
    "overseasaddress",
    "workpermitpass",
    "name",
    "relationship",
    "address_b",
    "mobilenumber",
    "hometelephonenumber",
    "officetelephonenumber",
    "emailaddress",
  ],
  ["family_members", "educations", "coursename", "coursestartdate", "expectedyearofcompletion"],
  ["experiences", "membershipsassociations", "description"],
  ["declarations", "references", "skipbackgroundcheck", "rcbcrequestissued", "bcrequestissued"],
];

const pathToFieldId = (path: string) => `field-${path.replace(/\./g, "-")}`;

const getNestedError = (errors: FieldErrors<any>, path: string) =>
  path.split(".").reduce<any>((acc, part) => {
    if (!acc) return undefined;
    return /^\d+$/.test(part) ? acc[Number(part)] : acc[part];
  }, errors);

/**
 * Defined at module scope on purpose. Declaring a component inside the page body
 * makes React see a new component type on every render and remount the subtree,
 * which drops focus and jumps the caret while typing.
 */
function ErrorText({ path }: { path: string }) {
  const {
    clearErrors,
    formState: { errors },
  } = useFormContext();
  const fieldError = getNestedError(errors, path);
  if (!fieldError?.message) return null;
  return <p className="mt-1.5 text-xs text-rose-500 font-medium">{String(fieldError.message)}</p>;
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
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
}

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
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
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
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
}

export default function JobApplicationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const jobId = params.id as string;
  const jobPortal = searchParams.get("job-portal");

  const resumeProps = useSupabaseUpload({
    bucketName: "candidate-resume",
    allowedMimeTypes: ["application/pdf"],
    // Safari reports an empty file.type for PDFs picked from Files / iCloud Drive,
    // which fails a MIME-only check, so accept the extension as well.
    allowedFileExtensions: [".pdf"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 5,
  });

  const [declareTruth, setDeclareTruth] = useState<boolean>(false);
  const [declareConsent, setDeclareConsent] = useState<boolean>(false);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);

  const defaultFields: FormField[] = [
    { id: "full_name", slug: "full_name", label: "Full Name", type: "char", required: true },
    { id: "email", slug: "email", label: "Email", type: "char", required: true },
    { id: "phone_number", slug: "phone_number", label: "WhatsApp Number", type: "char", required: true },
    { id: "nationalities", slug: "nationalities", label: "Nationality", type: "char", required: false },
    {
      id: "linkedin",
      slug: "linkedin",
      label: "LinkedIn Profile URL",
      type: "char",
      required: false,
      field_category: "social_media",
    },
    { id: "resume", slug: "resume", label: "Resume", type: "file", required: true, field_category: "resume" },
  ];

  const inputBase =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all duration-200 " +
    "hover:border-slate-300 text-sm";

  const cardBase = "bg-white border border-slate-100 rounded-2xl shadow-sm";

  const methods = useForm({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: buildDefaultValues(),
    mode: "onBlur",
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    trigger,
    clearErrors,
    formState: { errors },
  } = methods;

  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const stepTopRef = useRef<HTMLDivElement | null>(null);

  const activeStep = useApplicationFormStore((s) => s.activeStep);
  const maxVisitedStep = useApplicationFormStore((s) => s.maxVisitedStep);
  const completedSteps = useApplicationFormStore((s) => s.completedSteps);
  const setActiveStep = useApplicationFormStore((s) => s.setActiveStep);
  const markStepCompleted = useApplicationFormStore((s) => s.markStepCompleted);
  const markStepIncomplete = useApplicationFormStore((s) => s.markStepIncomplete);
  const saveDraftValues = useApplicationFormStore((s) => s.saveValues);
  const startJob = useApplicationFormStore((s) => s.startJob);
  const clearDraft = useApplicationFormStore((s) => s.clear);

  // Drops any draft belonging to a different job before the form is populated.
  useEffect(() => {
    if (jobId) {
      startJob(jobId);
    }
  }, [jobId, startJob]);

  const isLastStep = activeStep === STEPS.length - 1;

  const invalidSteps = useMemo(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return [];
    return STEP_FIELDS.reduce<number[]>((acc, fields, index) => {
      if (fields.some((field) => errorKeys.includes(field as string))) acc.push(index);
      return acc;
    }, []);
  }, [errors]);

  const scrollToStepTop = () => {
    requestAnimationFrame(() => {
      stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goToStep = async (target: number) => {
    if (target === activeStep) return;

    // Going back never validates — people must be able to retreat and fix things.
    if (target < activeStep) {
      saveDraftValues(getValues());
      setActiveStep(target);
      scrollToStepTop();
      return;
    }

    // Going forward validates every step being skipped over, so a step can never
    // be left behind in an invalid state.
    for (let step = activeStep; step < target; step++) {
      const valid = await trigger(STEP_FIELDS[step] as any);
      if (!valid) {
        markStepIncomplete(step);
        setActiveStep(step);
        onInvalid();
        return;
      }
      markStepCompleted(step);
    }

    saveDraftValues(getValues());
    setActiveStep(target);
    scrollToStepTop();
  };

  const handleContinue = () => goToStep(activeStep + 1);
  const handleBack = () => goToStep(activeStep - 1);


  const flattenErrors = (obj: FieldErrors<any>, parent = ""): ErrorSummaryItem[] => {
    const result: ErrorSummaryItem[] = [];

    Object.entries(obj).forEach(([key, value]) => {
      const path = parent ? `${parent}.${key}` : key;

      if (!value) return;

      if (typeof value === "object" && "message" in value && value.message) {
        result.push({ path, message: String(value.message) });
        return;
      }

      if (typeof value === "object") {
        result.push(...flattenErrors(value as FieldErrors<any>, path));
      }
    });

    return result;
  };

  const errorList = useMemo(() => flattenErrors(errors), [errors]);

  const scrollToField = (path: string) => {
    const el = document.getElementById(pathToFieldId(path));

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement).focus?.();
    }
  };

  const onInvalid = () => {
    requestAnimationFrame(() => {
      errorSummaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const {
    fields: familyFields,
    append: appendFamily,
    remove: removeFamily,
  } = useFieldArray({
    control,
    name: "family_members",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: "educations",
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: "experiences",
  });

  const {
    fields: referenceFields,
    append: appendReference,
    remove: removeReference,
  } = useFieldArray({
    control,
    name: "references",
  });

  const watchedResidentialStatus = watch("residentialstatus");
  // Singaporeans and PRs always hold an NRIC; a foreigner applying from overseas may
  // hold neither an NRIC nor a FIN. Mirrors the rule in jobApplicationSchema.
  const isNricFinRequired = watchedResidentialStatus !== "Foreigner";
  const watchedIsReferred = watch("is_referred");
  const watchedIsApplyingForTeacher = watch("is_applying_for_teacher");
  const watchedDeclarations = watch("declarations");
  const watchedReferences = watch("references");

  const today = new Date().toISOString().split("T")[0];

  usePreventRefresh(true);

  useEffect(() => {
    const uploadedUrl = resumeProps.successes[0];

    if (uploadedUrl) {
      setValue("resume", String(uploadedUrl), {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (getValues("resume")) {
      // The uploaded file was removed, so the stored URL no longer points at it.
      setValue("resume", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [resumeProps.successes, setValue, getValues]);

  // Submit-time failures render in a banner at the top of a very long form, so
  // bring it into view and mirror it as a toast instead of leaving the user at
  // the submit button with no visible feedback.
  useEffect(() => {
    if (!error) {
      return;
    }

    sileo.error({
      title: error.error,
      description: error.details,
    });

    requestAnimationFrame(() => {
      errorBannerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [error]);

  useEffect(() => {
    if (!watchedIsReferred) {
      setValue(
        "referrer_details",
        { referrer_name: "", referrer_email: "" },
        { shouldDirty: true, shouldValidate: false },
      );
    }
  }, [watchedIsReferred, setValue]);

  useEffect(() => {
    if (!watchedIsApplyingForTeacher) {
      setValue("preferredsubjectsandlevels", "", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [watchedIsApplyingForTeacher, setValue]);

  useEffect(() => {
    if (watchedResidentialStatus === "Foreigner") {
      // NRIC/FIN just became optional, so a "required" error left over from an earlier
      // selection would block the step for no reason.
      clearErrors("nricfin");
      return;
    }

    setValue("workpermitpass", "", { shouldDirty: true, shouldValidate: false });
    setValue("overseasaddress", "", { shouldDirty: true, shouldValidate: false });
  }, [watchedResidentialStatus, setValue, clearErrors]);

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
        }
        setJob(jobData);

        const fieldsRes = await fetch(`/api/jobs/${jobId}/form-fields`);
        let fields = defaultFields;

        if (fieldsRes.ok) {
          const data = await fieldsRes.json();
          if (data.fields?.length > 0) fields = data.fields;
        }

        setFormFields(fields);

        const nextDefaults = buildDefaultValues();

        fields.forEach((field) => {
          const key = getFieldKey(field);
          if (normalize(field.type) !== "file" && !(key in nextDefaults)) {
            nextDefaults[key] = "";
          }
        });

        // A draft saved earlier in this tab wins over the blank defaults, so a
        // refresh mid-application does not throw the answers away.
        const savedDraft = useApplicationFormStore.getState().values;
        reset(savedDraft ? { ...nextDefaults, ...savedDraft } : nextDefaults);
      } catch {
        setError({
          error: "Unable to load the application form.",
          details: "Please refresh the page. If the problem continues, try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, reset]);

  const getField = (...values: string[]) => formFields.find((field) => matches(field, ...values));
  const getFields = (...values: string[]) => formFields.filter((field) => matches(field, ...values));

  const renderField = (field: FormField) => {
    const key = getFieldKey(field);
    const inputId = pathToFieldId(key);

    const isResumeField = matches(field, "resume");
    const isSocialField = matches(field, "social_media", "LinkedIn Profile URL");
    const isDateField =
      normalize(field.type) === "datetime" ||
      normalize(getDisplayType(field)) === "date" ||
      matches(field, "birthdate", "date of birth", "coursestartdate", "course start date");
    const isLongTextField = normalize(field.type) === "longtext" || matches(field, "longtext");
    const isIntegerField = normalize(field.type) === "integer" || matches(field, "expectedyearofcompletion");
    const isBooleanField = normalize(field.type) === "boolean" || matches(field, "boolean");
    const isDropdownField = matches(field, "dropdown") && getChoices(field).length > 0;
    const isEmailField = matches(field, "email", "emailaddress");
    const isPhoneField = matches(
      field,
      "phonenumber",
      "mobilenumber",
      "hometelephonenumber",
      "officetelephonenumber",
      "whatsapp number",
      "mobile number",
      "telephone number",
    );
    const isPostalCodeField = matches(field, "postalcode", "postal code");
    const isGenderField = matches(field, "gender");
    const isResidentialStatusField = matches(field, "residentialstatus", "residential status");
    const isNationalityField = matches(field, "nationalities", "nationality");
    const isIndustryField = matches(field, "industries", "work industry");
    const isHighestQualificationField = matches(field, "latestdegree", "highest qualification");
    const isExpectedSalaryField = matches(field, "expectedsalary", "expected salary");
    const isStrictNumericField =
      normalize(field.type) === "integer" ||
      normalize(field.slug) === "postalcode" ||
      normalize(field.slug) === "yearsofexperience";

    if (field.label === "Briefly share your skills, experiences, and achievements beyond your resume") {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <textarea
                id={inputId}
                rows={5}
                value={field.value}
                onChange={field.onChange}
                className={`${inputBase} resize-none`}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isDateField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <DatePicker id={inputId} value={field.value} onChange={(v) => field.onChange(v)} onBlur={field.onBlur} />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isExpectedSalaryField) {
      return (
        <>
          <Controller
            control={control}
            name={"expected_salary" as any}
            render={({ field }) => (
              <input
                id={pathToFieldId("expected_salary")}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                }}
                placeholder="e.g. 3500"
                className={inputBase}
              />
            )}
          />

          <ErrorText path="expected_salary" />
        </>
      );
    }

    if (isResumeField) {
      return (
        <>
          <div id={pathToFieldId("resume")} tabIndex={-1} className="mt-1">
            <Dropzone {...resumeProps}>
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </div>
          <ErrorText path="resume" />
        </>
      );
    }

    if (isResidentialStatusField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <StyledSelect
                id={inputId}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select residential status"
                options={[
                  { value: "Singaporean", label: "Singaporean" },
                  { value: "PR", label: "PR" },
                  { value: "Foreigner", label: "Foreigner" },
                ]}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isNationalityField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => <NationalityCombobox id={inputId} {...field} />}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isIndustryField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <IndustryCombobox
                id={inputId}
                value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
                onChange={field.onChange}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isHighestQualificationField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <StyledSelect
                id={inputId}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select qualification"
                options={[
                  { value: "High School Diploma", label: "High School Diploma" },
                  { value: "Associates Degree", label: "Associate's Degree" },
                  { value: "Bachelors Degree", label: "Bachelor's Degree" },
                  { value: "Masters Degree", label: "Master's Degree" },
                  { value: "Doctorate", label: "Doctorate" },
                ]}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isDropdownField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field: controllerField }) => (
              <StyledSelect
                id={inputId}
                value={controllerField.value}
                onChange={controllerField.onChange}
                onBlur={controllerField.onBlur}
                placeholder="Select an option"
                options={getChoices(field).map((choice: string) => ({ value: choice, label: choice }))}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isGenderField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <StyledSelect
                id={inputId}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select gender"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isLongTextField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <textarea
                id={inputId}
                rows={4}
                value={field.value}
                onChange={field.onChange}
                className={`${inputBase} resize-none`}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isBooleanField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <StyledSelect
                id={inputId}
                value={field.value === true ? "true" : field.value === false ? "false" : ""}
                onChange={(v) => field.onChange(v === "true")}
                onBlur={field.onBlur}
                placeholder="Select option"
                options={[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isSocialField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <input
                id={inputId}
                type="url"
                value={field.value}
                onChange={field.onChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className={inputBase}
              />
            )}
          />

          <ErrorText path={key} />
        </>
      );
    }

    if (isNricFinField(field)) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <div className="relative">
                <input
                  id={inputId}
                  type="text"
                  inputMode="text"
                  value={field.value?.toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    if (/^[STFGM]?[0-9]{0,7}[A-Za-z]?$/i.test(v)) field.onChange(v);
                  }}
                  onKeyDown={(e) => {
                    if (!/[STFGM0-9A-Za-z]/i.test(e.key)) e.preventDefault();
                  }}
                  placeholder="e.g. S1234567A"
                  className={`${inputBase} uppercase tracking-widest font-mono`}
                  maxLength={9}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Singapore NRIC / FIN - 9 characters
                  {!isNricFinRequired && " - optional if you do not hold one"}
                </p>
              </div>
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isStrictNumericField || isIntegerField || isPostalCodeField) {
      const maxLength = isPostalCodeField ? 6 : undefined;

      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <input
                id={inputId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={field.value}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  field.onChange(maxLength ? numericValue.slice(0, maxLength) : numericValue);
                }}
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                }}
                placeholder={
                  isPostalCodeField
                    ? "e.g. 123456"
                    : field.name?.toLowerCase().includes("salary")
                      ? "e.g. 3500"
                      : field.name?.toLowerCase().includes("expectedyearofcompletion")
                        ? "e.g. 2025"
                        : "e.g. 5"
                }
                className={inputBase}
                maxLength={maxLength}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isEmailField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <input
                id={inputId}
                type="email"
                value={field.value}
                onChange={field.onChange}
                placeholder="you@email.com"
                className={inputBase}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    if (isPhoneField) {
      return (
        <>
          <Controller
            control={control}
            name={key as any}
            render={({ field }) => (
              <input
                id={inputId}
                type="tel"
                inputMode="tel"
                pattern="[0-9+\- ]*"
                value={field.value}
                onChange={field.onChange}
                onKeyDown={(e) => {
                  if (!/[0-9+\- ]/.test(e.key)) e.preventDefault();
                }}
                placeholder="+65 9123 4567"
                className={inputBase}
                maxLength={20}
              />
            )}
          />
          <ErrorText path={key} />
        </>
      );
    }

    return (
      <>
        <Controller
          control={control}
          name={key as any}
          render={({ field }) => (
            <input id={inputId} type="text" value={field.value} onChange={field.onChange} className={inputBase} />
          )}
        />
        <ErrorText path={key} />
      </>
    );
  };

  const renderFieldBlock = (field?: FormField, className = "", requiredOverride?: boolean) => {
    if (!field) return null;

    return (
      <div key={String(field.id)} className={className}>
        <Label required={requiredOverride ?? getRequired(field)}>{field.label}</Label>
        {renderField(field)}
      </div>
    );
  };

  const referenceCompletedCount = useMemo(() => {
    return (watchedReferences || []).filter(
      (r) => r?.name?.trim() && r?.email?.trim() && r?.contact_no?.trim() && r?.relationship?.trim(),
    ).length;
  }, [watchedReferences]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);

    try {
      // Runs server-side so the browser never talks to api.manatal.com directly.
      const duplicateCheckResponse = await fetch("/api/applications/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPk: Number(jobId),
          email: values.email,
          fullName: values.full_name,
        }),
      });

      if (!duplicateCheckResponse.ok) {
        const duplicateCheckError = await duplicateCheckResponse.json().catch(() => null);
        setError({
          error: duplicateCheckError?.error || "Unable to check for an existing application",
          details: "Please try again. If the problem continues, contact us before re-submitting.",
        });
        return;
      }

      const existingMatch = await duplicateCheckResponse.json();

      if (existingMatch.alreadyApplied) {
        sileo.error({
          title: "You have already applied for this job.",
          description: "Please wait for the employer to review your application.",
        });
        setSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      const applicationData: Record<string, any> = {};
      let expectedCurrencyId: string | null = null;

      const normalizedValues: FormValues = {
        ...values,
        experiences: values.experiences.map((exp) => ({
          ...exp,
          ended_at: exp.is_current_employer ? today : exp.ended_at,
        })),
      };

      const dynamicValues = normalizedValues as FormValues;

      formFields.forEach((field) => {
        const key = getFieldKey(field);
        const value = dynamicValues[key];
        let finalValue: any = "";

        if (typeof value === "string") {
          finalValue = value.trim();

          if (matches(field, "expected_salary") && finalValue) {
            expectedCurrencyId = "13";
          }
        } else if (typeof value === "number" || typeof value === "boolean") {
          finalValue = value;
        } else if (value == null) {
          finalValue = "";
        } else {
          finalValue = value;
        }

        applicationData[String(field.id)] = finalValue;
      });

      const trimmedFamilyMembers = normalizedValues.family_members
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
      applicationData["1771366"] = normalizedValues.skipbackgroundcheck;
      applicationData["1771465"] = normalizedValues.rcbcrequestissued;
      applicationData["1771466"] = normalizedValues.bcrequestissued;

      const formattedEducations = formatEducations(normalizedValues.educations);

      const educationField = formFields.find((field) =>
        matches(field, "educations", "education", "educational_profile", "educationalprofile"),
      );

      if (educationField && formattedEducations.length) {
        applicationData[String(educationField.id)] = formattedEducations;
      }

      const formattedExperiences = formatExperiences(normalizedValues.experiences);

      const experienceField = formFields.find((field) =>
        matches(field, "experiences", "experience", "employment_history", "employmenthistory", "work_experience"),
      );

      if (experienceField && formattedExperiences.length) {
        applicationData[String(experienceField.id)] = formattedExperiences;
      }

      const validReferences = normalizedValues.references
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

      if (validReferences.length < 3) {
        setError({
          error: "Please provide at least 3 character references.",
          details: "Add at least 3 references before submitting your application.",
        });

        setSubmitting(false);
        return;
      }

      applicationData["1741707"] = formatReferencesToHTML(validReferences);

      const declarationMap = normalizedValues.declarations.reduce<
        Record<number, { answer: "Yes" | "No"; details?: string }>
      >((acc, item, index) => {
        acc[index] = {
          answer: item.answer,
          details: item.details || "",
        };
        return acc;
      }, {});

      applicationData["1741708"] = generateDeclarationList(declarationMap);

      const resumeField = formFields.find((field) => matches(field, "resume"));
      if (normalizedValues.resume?.trim()) {
        if (resumeField) applicationData[String(resumeField.id)] = normalizedValues.resume.trim();
      } else if (resumeField && getRequired(resumeField)) {
        throw new Error("Please upload a resume file");
      }

      if (normalizedValues.workpermitpass?.trim()) {
        applicationData["1741698"] = normalizedValues.workpermitpass.trim();
      }

      if (normalizedValues.overseasaddress?.trim()) {
        applicationData["1741691"] = normalizedValues.overseasaddress.trim();
      }

      applicationData["1741702"] = values.industries.join(",");

      applicationData.organization_name = job?.org_name ?? "";
      applicationData.position_name = job?.position_name ?? "";
      applicationData.job_id = jobId;
      applicationData.job_portal = jobPortal ?? "";
      applicationData.referrer_email = normalizedValues.is_referred
        ? (normalizedValues.referrer_details?.referrer_email ?? "")
        : "";
      applicationData.referrer_name = normalizedValues.is_referred
        ? (normalizedValues.referrer_details?.referrer_name ?? "")
        : "";

      formDataToSend.append("application_data", JSON.stringify(applicationData));
      formDataToSend.append("jobId", jobId);

      if (normalizedValues.is_applying_for_teacher && normalizedValues.preferredsubjectsandlevels?.trim()) {
        formDataToSend.append("Preferred Subjects and Levels", normalizedValues.preferredsubjectsandlevels.trim());
      }

      if (expectedCurrencyId) {
        formDataToSend.append("expected_currency", expectedCurrencyId);
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        setError({
          error: result.error || result.message || "Failed to submit application",
          details: result.details,
        });
        return;
      }

      clearDraft();
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError({
        error: err.message || "Failed to submit application",
        details: err.details || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-slate-400 tracking-wide">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {submitting && <SubmittingOverlay />}

      {/* The submit bar only exists on the last step, so earlier steps point the
          floating button at that step's Continue bar instead. */}
      <ScrollToSubmitButton
        targetId={isLastStep ? "submit-application-action" : "step-nav-action"}
        threshold={900}
        disabled={submitting || submitSuccess}
        label={isLastStep ? "Scroll to submit" : "Scroll to continue"}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md mb-4">
                  Job Application
                </div>

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

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{job?.org_name || "Company"}</span>

                  {job?.org_website && (
                    <>
                      <span className="hidden sm:block text-slate-300">|</span>
                      <Link
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
                      </Link>
                    </>
                  )}

                  {job?.location && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      {job.location}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href={"/"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to listings
                </Link>
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
                Thank you for applying. We&apos;ll review your application and be in touch soon.
              </p>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-200">
                Browse More Jobs
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <ApplicationNote />
              <br />
              {/* noValidate: validation is owned by Zod + react-hook-form. Native
                  constraint validation would cancel submission before the submit
                  event fires, so handleSubmit/onInvalid never run and the user
                  sees nothing happen. */}
              <FormProvider {...methods}>
              <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                <div ref={errorSummaryRef}>
                  <ErrorSummary errors={errorList} onItemClick={scrollToField} />
                </div>

                {error && (
                  <div
                    ref={errorBannerRef}
                    className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex flex-col gap-1 text-sm">
                    <div>{error.error}</div>
                    {error.details && <div className="text-rose-600">{error.details}</div>}
                  </div>
                )}

                <div ref={stepTopRef} className="scroll-mt-4" />

                <div className={`${cardBase} sticky top-4 z-20 px-6 py-5`}>
                  <Stepper
                    steps={STEPS}
                    activeStep={activeStep}
                    onStepChange={(index) => void goToStep(index)}
                    completedSteps={completedSteps}
                    invalidSteps={invalidSteps}
                    maxNavigableStep={maxVisitedStep}
                  />
                  <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Step {activeStep + 1} of {STEPS.length}
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-slate-800">{STEPS[activeStep].title}</span>
                    </p>
                    <p className="hidden text-xs text-slate-400 sm:block">{STEP_SUMMARY[activeStep]}</p>
                  </div>
                </div>

                {activeStep === 0 && (
                  <div className="flex flex-col gap-6">
                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="01"
                    title="Application Information"
                    subtitle="Basic details about this application"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFieldBlock(getField("expected_salary", "Expected Salary"))}
                    {renderFieldBlock(getField("social_media", "LinkedIn Profile URL"))}
                    {renderFieldBlock(getField("industries", "Work Industry"))}
                    {renderFieldBlock(getField("years_of_experience", "Years of Experience"))}
                    {formFields
                      .filter(
                        (f) =>
                          getCategory(f) === "resume" ||
                          normalize(f.slug) === "resume" ||
                          normalize(f.name) === "resume" ||
                          normalize(f.label) === "resume" ||
                          String(f.id) === "1741683",
                      )
                      .map((f) => renderFieldBlock(f, "md:col-span-2"))}

                    <div
                      className={`md:col-span-2 rounded-2xl border p-5 transition-all duration-200 ${
                        watchedIsReferred ? "border-blue-200 bg-blue-50/30" : "border-slate-200 bg-white"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              watchedIsReferred ? "bg-blue-600 shadow-sm shadow-blue-200" : "bg-slate-100"
                            }`}>
                            <svg
                              className={`w-4 h-4 ${watchedIsReferred ? "text-white" : "text-slate-400"}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Were you referred by an HFSE employee?
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Let us know who referred you for this position
                            </p>
                          </div>
                        </div>

                        <Controller
                          control={control}
                          name="is_referred"
                          render={({ field }) => (
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(!field.value);
                                trigger("referrer_details");
                              }}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                field.value ? "bg-blue-600" : "bg-slate-200"
                              }`}>
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                                  field.value ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          )}
                        />
                      </div>

                      {watchedIsReferred && (
                        <div className="mt-5 pt-5 border-t border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label required>Referrer Name</Label>
                            <input
                              id={pathToFieldId("referrer_details.referrer_name")}
                              type="text"
                              {...register("referrer_details.referrer_name")}
                              placeholder="Full name of the person who referred you"
                              className={inputBase}
                            />
                            <ErrorText path="referrer_details.referrer_name" />
                          </div>

                          <div>
                            <Label required>Referrer Email</Label>
                            <input
                              id={pathToFieldId("referrer_details.referrer_email")}
                              type="email"
                              {...register("referrer_details.referrer_email")}
                              placeholder="email@example.com"
                              className={inputBase}
                            />
                            <ErrorText path="referrer_details.referrer_email" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border shadow-sm p-8 transition-all duration-200 ${
                    watchedIsApplyingForTeacher ? "bg-amber-50/30 border-amber-200" : "bg-white border-slate-100"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          watchedIsApplyingForTeacher ? "bg-amber-500 shadow-sm shadow-amber-200" : "bg-slate-100"
                        }`}>
                        <svg
                          className={`w-4 h-4 ${watchedIsApplyingForTeacher ? "text-white" : "text-slate-400"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 leading-tight">
                          For Teacher Position Only
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Toggle on if you are applying for a teaching role
                        </p>
                      </div>
                    </div>

                    <Controller
                      control={control}
                      name="is_applying_for_teacher"
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(!field.value);
                            trigger("preferredsubjectsandlevels");
                          }}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            field.value ? "bg-amber-500" : "bg-slate-200"
                          }`}>
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                              field.value ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      )}
                    />
                  </div>

                  {watchedIsApplyingForTeacher && (
                    <div className="mt-6 pt-6 border-t border-amber-100">
                      {getField("preferredsubjectsandlevels", "Preferred Subjects and Levels") ? (
                        <div>
                          <Label
                            required={getRequired(
                              getField("preferredsubjectsandlevels", "Preferred Subjects and Levels")!,
                            )}>
                            {getField("preferredsubjectsandlevels", "Preferred Subjects and Levels")!.label}
                          </Label>
                          <textarea
                            id={pathToFieldId("preferredsubjectsandlevels")}
                            rows={4}
                            {...register("preferredsubjectsandlevels")}
                            placeholder="e.g. English - Primary / Secondary, Mathematics - Secondary"
                            className={`${inputBase} resize-none focus:ring-amber-400/60 focus:border-amber-400`}
                          />

                          <p className="mt-1.5 text-xs text-slate-400">
                            List each subject and its corresponding level(s), one per line if needed
                          </p>
                          <ErrorText path="preferredsubjectsandlevels" />
                        </div>
                      ) : (
                        <div>
                          <Label required>Preferred Subjects &amp; Levels</Label>
                          <textarea
                            rows={4}
                            {...register("preferredsubjectsandlevels")}
                            placeholder="e.g. English - Primary & Secondary, Mathematics - Secondary"
                            className={`${inputBase} resize-none focus:ring-amber-400/60 focus:border-amber-400`}
                          />
                          <p className="mt-1.5 text-xs text-slate-400">
                            List each subject and its corresponding level(s), one per line if needed
                          </p>
                          <ErrorText path="preferredsubjectsandlevels" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="02"
                    title="Personal Information"
                    subtitle="Your personal details and identification"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFieldBlock(getField("full_name", "Full Name"))}
                    {renderFieldBlock(getField("preferredname", "Preferred Name"))}
                    {renderFieldBlock(getField("residentialstatus", "Residential Status"))}
                    {renderFieldBlock(getField("nationalities", "Nationality"))}

                    {watchedResidentialStatus === "Foreigner" && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-blue-50/50 border border-blue-100 rounded-xl">
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

                        <div>
                          <Label required>Work Pass</Label>
                          <Controller
                            control={control}
                            name="workpermitpass"
                            render={({ field }) => (
                              <StyledSelect
                                id={pathToFieldId("workpermitpass")}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                placeholder="Select work pass type"
                                options={workPassOptions.map((pass) => ({ value: pass, label: pass }))}
                              />
                            )}
                          />
                          <ErrorText path="workpermitpass" />
                        </div>

                        <div>
                          <Label required>Overseas Address</Label>
                          <input
                            id={pathToFieldId("overseasaddress")}
                            type="text"
                            {...register("overseasaddress")}
                            placeholder="Street, City, Country"
                            className={inputBase}
                          />
                          <ErrorText path="overseasaddress" />
                        </div>
                      </div>
                    )}
                    {renderFieldBlock(getField("birth_date", "Date of Birth"))}
                    {renderFieldBlock(getField("gender", "Gender"))}
                    {renderFieldBlock(getField("religion", "Religion"))}
                    {renderFieldBlock(getField("nricfin", "NRIC/FIN"), "", isNricFinRequired)}
                    {renderFieldBlock(getField("latest_degree", "Highest Qualification"))}

                    {renderFieldBlock(getField("passportno", "Passport Number"))}
                    {formFields.filter((f) => getFieldKey(f) === "placedateofissue").map((f) => renderFieldBlock(f))}
                  </div>
                </div>

                <div className={`${cardBase} p-8`}>
                  <SectionHeader number="03" title="Contact Information" subtitle="How we can reach you" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFieldBlock(getField("phone_number", "WhatsApp Number"))}
                    {renderFieldBlock(getField("email", "Email"))}
                    {renderFieldBlock(getField("address", "Complete Address"))}

                    {renderFieldBlock(getField("postalcode", "Postal Code"))}
                  </div>
                </div>

                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="04"
                    title="Person to Contact in Case of Emergency"
                    subtitle="Someone we can reach if needed"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFieldBlock(getField("name", "Emergency Contact Name"))}
                    {renderFieldBlock(getField("relationship", "Emergency Contact Relationship"))}
                    {renderFieldBlock(getField("address_b", "Emergency Contact Address"), "md:col-span-2")}
                    {renderFieldBlock(getField("mobilenumber", "Emergency Contact Mobile Number"))}
                    {renderFieldBlock(getField("hometelephonenumber", "Emergency Contact Home Telephone Number"))}
                    {renderFieldBlock(getField("officetelephonenumber", "Emergency Contact Office Telephone Number"))}
                    {renderFieldBlock(getField("emailaddress", "Emergency Contact Email Address"))}
                  </div>
                </div>

                  </div>
                )}

                {activeStep === 1 && (
                  <div className="flex flex-col gap-6">
                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="05"
                    title="Family Particulars"
                    subtitle="Details of immediate family members"
                  />
                  <div className="space-y-4">
                    {familyFields.map((member, i) => (
                      <div key={member.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Member {i + 1}
                          </span>
                          {familyFields.length > 1 && <RemoveButton onClick={() => removeFamily(i)} />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <Label>Name</Label>
                            <input
                              id={pathToFieldId(`family_members.${i}.name`)}
                              type="text"
                              {...register(`family_members.${i}.name`)}
                              className={inputBase}
                              placeholder="Full name"
                            />
                            <ErrorText path={`family_members.${i}.name`} />
                          </div>

                          <div>
                            <Label>Relationship</Label>
                            <Controller
                              control={control}
                              name={`family_members.${i}.relationship`}
                              render={({ field }) => (
                                <StyledSelect
                                  id={pathToFieldId(`family_members.${i}.relationship`)}
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  placeholder="Select relationship"
                                  options={[
                                    { value: "Father", label: "Father" },
                                    { value: "Mother", label: "Mother" },
                                    { value: "Spouse", label: "Spouse" },
                                    { value: "Son", label: "Son" },
                                    { value: "Daughter", label: "Daughter" },
                                    { value: "Sibling", label: "Sibling" },
                                    { value: "Relative", label: "Relative" },
                                  ]}
                                />
                              )}
                            />
                            <ErrorText path={`family_members.${i}.relationship`} />
                          </div>

                          <div>
                            <Label>Nationality</Label>
                            <input
                              id={pathToFieldId(`family_members.${i}.nationality`)}
                              type="text"
                              {...register(`family_members.${i}.nationality`)}
                              className={inputBase}
                              placeholder="e.g. Singaporean"
                            />
                            <ErrorText path={`family_members.${i}.nationality`} />
                          </div>

                          <div>
                            <Label>Age</Label>
                            <Controller
                              control={control}
                              name={`family_members.${i}.age`}
                              render={({ field }) => (
                                <input
                                  id={pathToFieldId(`family_members.${i}.age`)}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                  onKeyDown={(e) => {
                                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                                  }}
                                  className={inputBase}
                                  placeholder="e.g. 45"
                                />
                              )}
                            />
                            <ErrorText path={`family_members.${i}.age`} />
                          </div>

                          <div>
                            <Label>Occupation</Label>
                            <input
                              id={pathToFieldId(`family_members.${i}.occupation`)}
                              type="text"
                              {...register(`family_members.${i}.occupation`)}
                              className={inputBase}
                              placeholder="Job title or role"
                            />
                            <ErrorText path={`family_members.${i}.occupation`} />
                          </div>

                          <div>
                            <Label>Company</Label>
                            <input
                              id={pathToFieldId(`family_members.${i}.company`)}
                              type="text"
                              {...register(`family_members.${i}.company`)}
                              className={inputBase}
                              placeholder="Employer optional"
                            />
                            <ErrorText path={`family_members.${i}.company`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <AddButton
                      onClick={() =>
                        appendFamily({
                          name: "",
                          relationship: "",
                          nationality: "",
                          age: "",
                          occupation: "",
                          company: "",
                        })
                      }
                      label="Add Family Member"
                    />
                  </div>
                </div>

                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="06"
                    title="Educational Profile"
                    subtitle="Your academic background and qualifications"
                  />
                  <div className="space-y-4">
                    {educationFields.map((edu, i) => (
                      <div key={edu.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Education {i + 1}
                          </span>
                          {educationFields.length > 1 && <RemoveButton onClick={() => removeEducation(i)} />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label required>School / Institution</Label>
                            <input
                              id={pathToFieldId(`educations.${i}.school`)}
                              type="text"
                              {...register(`educations.${i}.school`)}
                              className={inputBase}
                              placeholder="e.g. National University of Singapore"
                            />
                            <ErrorText path={`educations.${i}.school`} />
                          </div>

                          <div>
                            <Label required>Highest Qualification</Label>
                            <Controller
                              control={control}
                              name={`educations.${i}.degree_name`}
                              render={({ field }) => (
                                <StyledSelect
                                  id={pathToFieldId(`educations.${i}.degree_name`)}
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  placeholder="Select qualification"
                                  options={[
                                    { value: "High School Diploma", label: "High School Diploma" },
                                    { value: "Associates Degree", label: "Associate's Degree" },
                                    { value: "Bachelors Degree", label: "Bachelor's Degree" },
                                    { value: "Masters Degree", label: "Master's Degree" },
                                    { value: "Doctorate", label: "Doctorate" },
                                  ]}
                                />
                              )}
                            />
                            <ErrorText path={`educations.${i}.degree_name`} />
                          </div>

                          <div>
                            <Label>Specialization / Major</Label>
                            <input
                              id={pathToFieldId(`educations.${i}.specialization`)}
                              type="text"
                              {...register(`educations.${i}.specialization`)}
                              className={inputBase}
                              placeholder="e.g. Computer Science"
                            />
                            <ErrorText path={`educations.${i}.specialization`} />
                          </div>

                          <div>
                            <Label>Location</Label>
                            <input
                              id={pathToFieldId(`educations.${i}.location`)}
                              type="text"
                              {...register(`educations.${i}.location`)}
                              className={inputBase}
                              placeholder="City, Country"
                            />
                            <ErrorText path={`educations.${i}.location`} />
                          </div>

                          <div>
                            <Label required>Start Date</Label>
                            <Controller
                              control={control}
                              name={`educations.${i}.started_at`}
                              render={({ field }) => (
                                <DatePicker
                                  id={pathToFieldId(`educations.${i}.started_at`)}
                                  value={field.value}
                                  onChange={(v) => field.onChange(v)}
                                  onBlur={field.onBlur}
                                />
                              )}
                            />
                            <ErrorText path={`educations.${i}.started_at`} />
                          </div>

                          <div>
                            <Label>End Date</Label>
                            <Controller
                              control={control}
                              name={`educations.${i}.ended_at`}
                              render={({ field }) => (
                                <DatePicker
                                  id={pathToFieldId(`educations.${i}.ended_at`)}
                                  value={field.value ?? ""}
                                  onChange={(v) => field.onChange(v || null)}
                                  onBlur={field.onBlur}
                                />
                              )}
                            />
                            <ErrorText path={`educations.${i}.ended_at`} />
                          </div>

                          <div className="md:col-span-2">
                            <Label>Description</Label>
                            <textarea
                              id={pathToFieldId(`educations.${i}.description`)}
                              {...register(`educations.${i}.description`)}
                              rows={3}
                              placeholder="Achievements, honours, extracurriculars..."
                              className={`${inputBase} resize-none`}
                            />
                            <ErrorText path={`educations.${i}.description`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <AddButton
                      onClick={() =>
                        appendEducation({
                          school: "",
                          degree_name: "",
                          specialization: "",
                          started_at: "",
                          ended_at: null,
                          location: "",
                          description: "",
                        })
                      }
                      label="Add Education"
                    />
                  </div>
                </div>

                {getFields("coursename", "coursestartdate", "expectedyearofcompletion").length > 0 && (
                  <div className={`${cardBase} p-8`}>
                    <SectionHeader
                      number="07"
                      title="Other Courses Currently Pursuing"
                      subtitle="Any ongoing studies or certifications"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {renderFieldBlock(getField("coursename", "Course Name"), "md:col-span-2")}
                      {renderFieldBlock(getField("coursestartdate", "Course Start Date"))}
                      {renderFieldBlock(getField("expectedyearofcompletion", "Expected Year of Completion"))}
                    </div>
                  </div>
                )}

                  </div>
                )}

                {activeStep === 2 && (
                  <div className="flex flex-col gap-6">
                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="08"
                    title="Employment History"
                    subtitle="Your work experience, most recent first"
                  />
                  <div className="space-y-4">
                    {experienceFields.map((exp, i) => {
                      const isCurrent = watch(`experiences.${i}.is_current_employer`);

                      return (
                        <div key={exp.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Experience {i + 1}
                            </span>
                            {experienceFields.length > 1 && <RemoveButton onClick={() => removeExperience(i)} />}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label required>From</Label>
                              <Controller
                                control={control}
                                name={`experiences.${i}.started_at`}
                                render={({ field }) => (
                                  <DatePicker
                                    id={pathToFieldId(`experiences.${i}.started_at`)}
                                    value={field.value}
                                    onChange={(v) => field.onChange(v)}
                                    onBlur={field.onBlur}
                                  />
                                )}
                              />
                              <ErrorText path={`experiences.${i}.started_at`} />
                            </div>

                            <div>
                              <Label>{isCurrent ? "To" : "To *"}</Label>
                              <Controller
                                control={control}
                                name={`experiences.${i}.ended_at`}
                                render={({ field }) => (
                                  <DatePicker
                                    id={pathToFieldId(`experiences.${i}.ended_at`)}
                                    value={isCurrent ? today : field.value || ""}
                                    onChange={(v) => field.onChange(v || null)}
                                    onBlur={field.onBlur}
                                    disabled={!!isCurrent}
                                  />
                                )}
                              />
                              <ErrorText path={`experiences.${i}.ended_at`} />
                            </div>

                            <div>
                              <Label required>Company and Country</Label>
                              <input
                                id={pathToFieldId(`experiences.${i}.employer`)}
                                type="text"
                                {...register(`experiences.${i}.employer`)}
                                className={inputBase}
                                placeholder="e.g. ABC School, Singapore"
                              />
                              <ErrorText path={`experiences.${i}.employer`} />
                            </div>

                            <div>
                              <Label required>Position</Label>
                              <input
                                id={pathToFieldId(`experiences.${i}.title`)}
                                type="text"
                                {...register(`experiences.${i}.title`)}
                                className={inputBase}
                                placeholder="e.g. Senior Teacher"
                              />
                              <ErrorText path={`experiences.${i}.title`} />
                            </div>

                            <div>
                              <Label>Last Withdrawn Salary</Label>
                              <input
                                id={pathToFieldId(`experiences.${i}.salary`)}
                                type="text"
                                {...register(`experiences.${i}.salary`)}
                                className={inputBase}
                                placeholder="e.g. SGD 5,000 / month"
                              />
                              <ErrorText path={`experiences.${i}.salary`} />
                            </div>

                            <div>
                              <Label>Other Allowances</Label>
                              <input
                                id={pathToFieldId(`experiences.${i}.other_allowances`)}
                                type="text"
                                {...register(`experiences.${i}.other_allowances` as const)}
                                className={inputBase}
                                placeholder="e.g. Transport, housing"
                              />
                              <ErrorText path={`experiences.${i}.other_allowances`} />
                            </div>

                            <div className="md:col-span-2">
                              <Label>Reason for Leaving</Label>
                              <textarea
                                id={pathToFieldId(`experiences.${i}.reason_for_leaving`)}
                                {...register(`experiences.${i}.reason_for_leaving` as const)}
                                rows={3}
                                placeholder="Why you left this role"
                                className={`${inputBase} resize-none`}
                              />
                              <ErrorText path={`experiences.${i}.reason_for_leaving`} />
                            </div>

                            <div className="md:col-span-2">
                              <Controller
                                control={control}
                                name={`experiences.${i}.is_current_employer`}
                                render={({ field }) => (
                                  <label
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none w-full ${
                                      field.value
                                        ? "border-blue-400 bg-blue-50 text-blue-700"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                    }`}>
                                    <input
                                      id={pathToFieldId(`experiences.${i}.is_current_employer`)}
                                      type="checkbox"
                                      checked={!!field.value}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        field.onChange(checked);
                                        if (checked) {
                                          setValue(`experiences.${i}.ended_at`, null, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          });
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    {field.value ? (
                                      <svg className="w-4 h-4 flex-shrink-0 fill-current" viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        />
                                      </svg>
                                    ) : (
                                      <span className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                                    )}
                                    I currently work here
                                  </label>
                                )}
                              />
                              <ErrorText path={`experiences.${i}.is_current_employer`} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <AddButton
                      onClick={() =>
                        appendExperience({
                          title: "",
                          employer: "",
                          salary: "",
                          started_at: "",
                          ended_at: null,
                          is_current_employer: false,
                          description: "",
                        })
                      }
                      label="Add Experience"
                    />
                  </div>
                </div>

                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="09"
                    title="Additional Information"
                    subtitle="Other details relevant to your application"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFieldBlock(
                      getField("membershipsassociations", "Memberships & Associations"),
                      "md:col-span-2",
                    )}
                    {renderFieldBlock(
                      getField(
                        "description",
                        "Briefly share your skills, experiences, and achievements beyond your resume",
                      ),
                      "md:col-span-2",
                    )}
                  </div>
                </div>

                  </div>
                )}

                {activeStep === 3 && (
                  <div className="flex flex-col gap-6">
                <div className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="10"
                    title="Declaration"
                    subtitle="Please answer all questions honestly. All information is kept confidential."
                  />
                  <div className="space-y-6">
                    {declarationQuestions.map((question, i) => {
                      const current = watchedDeclarations?.[i];

                      return (
                        <div key={i} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                          <p className="text-sm text-slate-700 mb-3 leading-relaxed font-medium">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold mr-2.5">
                              {i + 1}
                            </span>
                            {question}
                            <span className="text-rose-400 ml-1">*</span>
                          </p>

                          <div id={pathToFieldId(`declarations.${i}.answer`)} tabIndex={-1} className="flex gap-3">
                            {(["Yes", "No"] as const).map((option) => (
                              <label
                                key={option}
                                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none ${
                                  current?.answer === option
                                    ? option === "Yes"
                                      ? "border-amber-400 bg-amber-50 text-amber-700"
                                      : "border-emerald-400 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                }`}>
                                <input
                                  type="radio"
                                  value={option}
                                  checked={current?.answer === option}
                                  onChange={() => {
                                    setValue(`declarations.${i}.answer`, option, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });

                                    if (option === "No") {
                                      setValue(`declarations.${i}.details`, "", {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      });
                                    }
                                  }}
                                  className="sr-only"
                                />
                                {current?.answer === option && (
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    />
                                  </svg>
                                )}
                                {option}
                              </label>
                            ))}
                          </div>
                          <ErrorText path={`declarations.${i}.answer`} />

                          {current?.answer === "Yes" && (
                            <div className="mt-3">
                              <textarea
                                id={pathToFieldId(`declarations.${i}.details`)}
                                rows={3}
                                {...register(`declarations.${i}.details`)}
                                placeholder="Please provide details..."
                                className={`${inputBase} resize-none`}
                              />
                              <ErrorText path={`declarations.${i}.details`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div id={pathToFieldId("references.root")} className={`${cardBase} p-8`}>
                  <SectionHeader
                    number="11"
                    title="Character References"
                    subtitle="Please provide at least 3 references"
                  />

                  <div className="flex items-center gap-2 mb-5 -mt-3">
                    {[0, 1, 2].map((i) => {
                      const filled =
                        watchedReferences?.[i] &&
                        watchedReferences[i].name.trim() &&
                        watchedReferences[i].email.trim() &&
                        watchedReferences[i].contact_no.trim() &&
                        watchedReferences[i].relationship.trim();

                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            filled
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}>
                          {filled ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="w-3 h-3 rounded-full border-2 border-current inline-block" />
                          )}
                          Reference {i + 1}
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    {referenceFields.map((ref, i) => (
                      <div key={ref.id} className="relative p-6 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Reference {i + 1}
                          </span>
                          {referenceFields.length > 1 && <RemoveButton onClick={() => removeReference(i)} />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label required>Name</Label>
                            <input
                              id={pathToFieldId(`references.${i}.name`)}
                              type="text"
                              {...register(`references.${i}.name`)}
                              className={inputBase}
                              placeholder="Full name"
                            />
                            <ErrorText path={`references.${i}.name`} />
                          </div>

                          <div>
                            <Label required>Email</Label>
                            <input
                              id={pathToFieldId(`references.${i}.email`)}
                              type="email"
                              {...register(`references.${i}.email`)}
                              className={inputBase}
                              placeholder="email@example.com"
                            />
                            <ErrorText path={`references.${i}.email`} />
                          </div>

                          <div>
                            <Label required>Contact Number</Label>

                            <input
                              id={pathToFieldId(`references.${i}.contact_no`)}
                              type="tel"
                              {...register(`references.${i}.contact_no`)}
                              className={inputBase}
                              placeholder="+65 9123 4567"
                            />
                            <ErrorText path={`references.${i}.contact_no`} />
                          </div>

                          <div>
                            <Label required>Company &amp; Occupation</Label>
                            <input
                              id={pathToFieldId(`references.${i}.company_occupation`)}
                              type="text"
                              {...register(`references.${i}.company_occupation`)}
                              className={inputBase}
                              placeholder="e.g. Acme Corp, Senior Manager"
                            />
                            <ErrorText path={`references.${i}.company_occupation`} />
                          </div>

                          <div>
                            <Label required>Relationship to Applicant</Label>

                            <input
                              id={pathToFieldId(`references.${i}.relationship`)}
                              type="text"
                              {...register(`references.${i}.relationship`)}
                              className={inputBase}
                              placeholder="e.g. Former Supervisor, Colleague"
                            />
                            <ErrorText path={`references.${i}.relationship`} />
                          </div>

                          <div>
                            <Label required>Years Known</Label>
                            <input
                              id={pathToFieldId(`references.${i}.years_known`)}
                              type="text"
                              {...register(`references.${i}.years_known`)}
                              className={inputBase}
                              placeholder="e.g. 5"
                            />
                            <ErrorText path={`references.${i}.years_known`} />
                          </div>

                          <div className="mt-4 col-span-2">
                            <Label required>
                              Do you agree to send this reference the appropriate verification form based on your answer
                              above?
                            </Label>
                            <div
                              id={pathToFieldId(`references.${i}.consent_to_contact`)}
                              tabIndex={-1}
                              className="flex gap-3 pt-1">
                              {[
                                { value: "I agree", label: "I agree" },
                                { value: "I don't agree", label: "I don't agree" },
                              ].map(({ value, label }) => {
                                const current = watch(`references.${i}.consent_to_contact`);
                                const isSelected = String(current) === value;

                                return (
                                  <label
                                    key={value}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none ${
                                      isSelected
                                        ? value === "I agree"
                                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                          : "border-rose-400 bg-rose-50 text-rose-700"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                    }`}>
                                    <input
                                      type="radio"
                                      value={value}
                                      {...register(`references.${i}.consent_to_contact`, {
                                        setValueAs: (v) => v,
                                      })}
                                      className="sr-only"
                                    />
                                    {isSelected && (
                                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        />
                                      </svg>
                                    )}
                                    {label}
                                  </label>
                                );
                              })}
                            </div>
                            <ErrorText path={`references.${i}.consent_to_contact`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <AddButton
                      onClick={() =>
                        appendReference({
                          name: "",
                          email: "",
                          contact_no: "",
                          company_occupation: "",
                          relationship: "",
                          is_work_related: "No",
                          years_known: "",
                          consent_to_contact: "I agree",
                        })
                      }
                      label="Add Reference"
                    />
                    {referenceCompletedCount >= 3 && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Minimum references met
                      </span>
                    )}
                  </div>
                </div>

                <ConsentDeclarations
                  declareConsent={declareConsent}
                  declareTruth={declareTruth}
                  setDeclareConsent={setDeclareConsent}
                  setDeclareTruth={setDeclareTruth}
                />

                <ApplicationNote />

                <div
                  id="submit-application-action"
                  className="relative bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Trust + Info */}
                  <div className="flex items-start gap-3 text-sm text-slate-500">
                    <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>

                    <div className="leading-relaxed max-w-xl">
                      <p className="text-slate-500 text-balance">
                        By submitting, you confirm that all information provided is{" "}
                        <span className="font-medium text-slate-700">accurate</span> and complete. You won’t be able to
                        edit this after submission.
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={submitting}
                      className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all">
                      <ArrowLeft className="size-4" />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => router.back()}
                      disabled={submitting}
                      className="cursor-pointer px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all">
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting || !declareTruth || !declareConsent}
                      className="cursor-pointer flex justify-center items-center gap-2 px-7 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200 active:scale-[0.98]">
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <ArrowUpRight className="size-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Optional subtle divider accent */}
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                </div>
                  </div>
                )}

                {!isLastStep && (
                  <div id="step-nav-action" className={`${cardBase} p-6 flex items-center justify-between gap-4`}>
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={activeStep === 0}
                      className="cursor-pointer flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <ArrowLeft className="size-4" />
                      Back
                    </button>

                    <p className="hidden text-xs text-slate-400 sm:block">
                      {STEPS.length - activeStep - 1} step{STEPS.length - activeStep - 1 > 1 ? "s" : ""} remaining
                    </p>

                    <button
                      type="button"
                      onClick={handleContinue}
                      className="cursor-pointer flex items-center gap-2 px-7 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-[0.98]">
                      Continue
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                )}
              </form>
              </FormProvider>
            </>
          )}
        </div>
      </div>
    </>
  );
}
