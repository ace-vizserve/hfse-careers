"use client";

import { ApplicationFormField, inputBase } from "@/components/application-form/application-field";
import { Input } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { ApplicationNote } from "@/components/ui/application-note";
import { ConsentDeclarations } from "@/components/ui/consent-declarations";
import { DatePicker } from "@/components/ui/date-picker";
import { IndustryCombobox } from "@/components/ui/industry-combo-box";
import { NationalityCombobox } from "@/components/ui/nationality-combo-box";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
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
import { createManatalIdResolver, MANATAL_FIELDS, type ManatalLiveField } from "@/lib/forms/application-fields";
import { type ApplicationDraft, useApplicationFormStore } from "@/lib/stores/application-form-store";
import type { JobDetail } from "@/lib/types/job";
import { JobApplicationFormValues, jobApplicationSchema } from "@/lib/validators/job-application";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown, ChevronLeft, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  FieldErrors,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { sileo } from "sileo";



type FormValues = JobApplicationFormValues & Record<string, any>;

const FORM_ID = "job-application-form";

/**
 * Which portal sent the candidate here, carried on the URL. It is only ever
 * needed in the submitted payload, so reading it at submit time keeps
 * `useSearchParams` out of the render — and with it, the Suspense boundary that
 * would stop this whole form from being prerendered.
 */
const readJobPortal = () => new URLSearchParams(window.location.search).get("job-portal") ?? "";

/** The schema asks for three; the UI mirrors that instead of hiding it behind Add. */
const MIN_REFERENCES = 3;

const declarationQuestions = [
  "Have you been or are you suffering from any disease/major medical condition/mental illness or physical impairment?",
  "Have you been discharged or dismissed from the service of your previous employers?",
  "Have you been convicted in a Court of law in any country or any ongoing legal proceedings?",
  "Have you been served with a Garnishee Order by any organisation or been declared a bankrupt?",
  "Have you any relatives and/or friends who have worked or are working in HFSE International School?",
] as const;

/** Rendered by ConsentDeclarations, so they have no `field-` element of their own. */
type FieldIssue = { path: string; message: string };

const CONSENT_PATHS = new Set(["declare_truth", "declare_consent"]);

const normalize = (value?: string | number | null) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");



/**
 * Every custom-field id is resolved from this response, with the ids in
 * APPLICATION_FIELDS as the fallback for when the fetch fails and the list
 * arrives empty. The table was wrong for a long time and nothing caught it,
 * because Manatal accepts a mis-filed string without complaint.
 */
type ManatalSectionField = ManatalLiveField;

const matchesSection = (field: ManatalSectionField, ...names: string[]) => {
  const pool = [normalize(field.slug), normalize(field.name), normalize(field.label)];
  return names.some((candidate) => pool.includes(normalize(candidate)));
};

const STEPS: StepperStep[] = [
  { id: "about", title: "About You", description: "Details & contact" },
  { id: "background", title: "Family & Education", description: "Family & schooling" },
  { id: "experience", title: "Experience", description: "Work history" },
  { id: "declarations", title: "Declarations", description: "Declare & confirm" },
];

/**
 * Which schema paths each step owns. `trigger()` runs against this list before
 * the step advances, so a step can never be left behind in an invalid state,
 * and every required path belongs to exactly one step.
 */
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
  [
    "declarations",
    "references",
    "declare_truth",
    "declare_consent",
    "skipbackgroundcheck",
    "rcbcrequestissued",
    "bcrequestissued",
  ],
];

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

  // Three are required, so three empty rows are laid out up front rather than
  // making the candidate discover an Add button twice.
  references: Array.from({ length: MIN_REFERENCES }, () => ({
    name: "",
    email: "",
    contact_no: "",
    company_occupation: "",
    relationship: "",
    is_work_related: "No",
    years_known: "",
    consent_to_contact: "I agree",
  })),

  declare_truth: false,
  declare_consent: false,

  skipbackgroundcheck: false,
  rcbcrequestissued: false,
  bcrequestissued: false,
});

/**
 * Lay a saved draft over a fresh set of defaults.
 *
 * A shallow spread is not enough. A draft is written by whichever build the
 * candidate started in and lives as long as their tab, so an array can be
 * shorter than the section the form now renders -- declarations are indexed
 * against a fixed question list, references against a minimum of three -- and
 * a nested object can be missing a key the schema has since gained. Either one
 * reaches the form as a value that fails validation with no input on screen to
 * fix it in. So merge position by position, and drop any key the defaults no
 * longer describe.
 */
const mergeDraft = (defaults: FormValues, draft: ApplicationDraft): FormValues => {
  const merged: FormValues = { ...defaults };
  const saved = draft as Record<string, unknown>;

  Object.keys(defaults).forEach((key) => {
    if (saved[key] === undefined) return;

    const fallback = defaults[key];
    const value = saved[key];

    if (Array.isArray(fallback)) {
      const savedRows = Array.isArray(value) ? value : [];
      const seedRow = fallback[0];

      // Keep every row the candidate added, but never fewer than the section
      // seeds, and fill each row out from the shape it was seeded with.
      merged[key] = Array.from({ length: Math.max(savedRows.length, fallback.length) }, (_, index) => {
        const seed = fallback[index] ?? seedRow;
        const row = savedRows[index];

        return seed && typeof seed === "object" && row && typeof row === "object" ? { ...seed, ...row } : (row ?? seed);
      });
      return;
    }

    if (fallback && typeof fallback === "object" && value && typeof value === "object") {
      merged[key] = { ...fallback, ...value };
      return;
    }

    merged[key] = value;
  });

  return merged;
};

/**
 * These render on every section of a very long form, so they live at module
 * scope. Declared inside the page component they would be a new component type
 * on every render, and React would tear down and rebuild each one rather than
 * update it -- which drops focus and loses clicks aimed at the buttons.
 */
const getNestedError = (errors: FieldErrors<any>, path: string) =>
  path.split(".").reduce<any>((acc, part) => {
    if (!acc) return undefined;
    return /^\d+$/.test(part) ? acc[Number(part)] : acc[part];
  }, errors);

const ErrorText = ({ path }: { path: string }) => {
  const {
    formState: { errors },
  } = useFormContext();

  const fieldError = getNestedError(errors, path);
  if (!fieldError?.message) return null;
  return <p className="mt-1.5 text-[12px] font-medium text-[#C2410C]">{String(fieldError.message)}</p>;
};

const SectionHeader = ({
  number,
  title,
  subtitle,
  aside,
}: {
  number: string;
  title: string;
  subtitle?: string;
  /** Right-hand slot, e.g. the references progress badge on the artboard. */
  aside?: ReactNode;
}) => (
  <div className="mb-5 flex items-center justify-between gap-[13px] border-b border-[#ECEFF7] pb-4">
    <div className="flex items-center gap-[13px]">
      <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E2FA8]">
        <span className="text-[12px] font-semibold text-white">{number}</span>
      </div>
      <div>
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.02em] text-[#10162B]">{title}</h3>
        {subtitle && <p className="mt-px text-[12px] text-[#6C7591]">{subtitle}</p>}
      </div>
    </div>
    {aside}
  </div>
);

/**
 * Wraps the shadcn (Radix) Label so clicking the text focuses its control, and
 * keeps the `required` prop the call sites already pass. `htmlFor` is optional
 * because several of these sit directly above their input inside a wrapper.
 */
const Label = ({ children, required, htmlFor }: { children: ReactNode; required?: boolean; htmlFor?: string }) => (
  <UiLabel htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-semibold text-[#10162B]">
    {children}
    {required && <span className="ml-0.5 text-[#C2410C]">*</span>}
  </UiLabel>
);

const AddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-h-[38px] items-center gap-2 rounded-[7px] border border-[#C3CBE8] bg-white px-4 py-[9px] text-[13px] font-semibold text-[#1E2FA8] shadow-[0_1px_2px_rgba(16,22,43,0.05)] transition-colors hover:bg-[#F7F9FF]">
    <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-[#E7EAFB] text-[14px] font-bold leading-none text-[#1E2FA8]">
      +
    </span>
    {label}
  </button>
);

const RemoveButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-[#8A92AB] transition-colors hover:bg-[#F2F4FA] hover:text-[#C2410C]">
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

type OutstandingGroup = { step: number; title: string; items: FieldIssue[] };

/**
 * "Relationship is required" three times over tells a candidate nothing about
 * which of their three references is short. Array paths carry the row index, so
 * say it.
 */
const issueLabel = (issue: FieldIssue) => {
  const row = issue.path.split(".").find((part) => /^\d+$/.test(part));
  return row === undefined ? issue.message : `${issue.message} — entry ${Number(row) + 1}`;
};

/**
 * Submit stays disabled until the whole schema passes. On a form this long the
 * answer holding it up is usually on a step the candidate has already left
 * behind, so a greyed-out button on its own is a dead end: nothing names the
 * field and nothing points at the step. This lists what is left and takes them
 * there.
 */
const OutstandingSummary = ({ groups, onJump }: { groups: OutstandingGroup[]; onJump: (path: string) => void }) => {
  const count = groups.reduce((total, group) => total + group.items.length, 0);

  return (
    <div
      className="rounded-[9px] border border-[#F6D6B8] bg-[#FDECD9] px-4 py-3.5"
      role="status"
      aria-live="polite">
      <div className="text-[13px] font-semibold text-[#8A3D0B]">
        {count === 1 ? "1 answer is still needed" : `${count} answers are still needed`} before you can submit
      </div>

      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group.step}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#A4551C]">{group.title}</div>
            <ul className="mt-1.5 space-y-1">
              {group.items.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => onJump(item.path)}
                    className="text-left text-[12px] font-medium text-[#8A3D0B] underline decoration-[#E0B48C] underline-offset-2 transition-colors hover:text-[#6B2F08] hover:decoration-[#8A3D0B]">
                    {issueLabel(item)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * react-hook-form focuses the first input of an appended row by default. On a
 * form this long that scrolls the viewport to the new row, and the next click
 * on the same "Add" button then blurs that empty required input: validation
 * paints an error under it, the button slides out from under the pointer
 * between mousedown and mouseup, and the click is swallowed. Adding a row
 * leaves focus where it is instead.
 */
const NO_FOCUS = { shouldFocus: false } as const;

type ApplyClientProps = {
  job: JobDetail;
  sectionFields: ManatalSectionField[];
};

export default function ApplyClient({ job, sectionFields }: ApplyClientProps) {
  const router = useRouter();

  const jobId = String(job.id);

  // Uploads used to land in the bucket root under the candidate's own filename,
  // with upsert on. Two applicants who both sent "resume.pdf" collided: the
  // second silently overwrote the first, and the first candidate's Manatal
  // record then pointed at the second candidate's document. A per-application
  // folder makes that impossible and keeps the URLs unguessable.
  const uploadFolder = useMemo(() => crypto.randomUUID(), []);

  /**
   * Manatal's own id for a field, by slug or label, with the id in
   * APPLICATION_FIELDS as the fallback. Every id in the payload goes through
   * this, so the ATS is the source of truth and the table is only a safety net
   * for a failed fetch.
   */
  const manatalId = useMemo(() => createManatalIdResolver(sectionFields), [sectionFields]);


  const resumeProps = useSupabaseUpload({
    bucketName: "candidate-resume",
    path: `${jobId}/${uploadFolder}`,
    upsert: false,
    allowedMimeTypes: ["application/pdf"],
    // Safari reports an empty file.type for PDFs picked from Files / iCloud Drive,
    // which fails a MIME-only check, so accept the extension as well.
    allowedFileExtensions: [".pdf"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 5,
  });


  /**
   * The form ships as prerendered HTML, so it is painted well before React has
   * attached to it and a click in that gap does nothing at all. This says when
   * the gap has closed.
   */
  const [interactive, setInteractive] = useState(false);

  useEffect(() => setInteractive(true), []);

  const [submitting, setSubmitting] = useState(false);
  /** The compact step menu shown in place of the full rail on phones. */
  const [stepMenuOpen, setStepMenuOpen] = useState(false);
  /** A step's answers are with Manatal; leaving is on hold until it answers. */
  const [checkingStep, setCheckingStep] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);


  const cardBase =
    "bg-white rounded-xl shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]";

  const methods = useForm({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: buildDefaultValues(),
    mode: "onTouched",
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    // Aliased: `setError` is already the page's own submit-error state.
    setError: setFormError,
    watch,
    trigger,
    clearErrors,
    formState: { errors, isValid, isDirty },
  } = methods;

  const errorBannerRef = useRef<HTMLDivElement | null>(null);

  const pathToFieldId = (path: string) => `field-${path.replace(/\./g, "-")}`;

  const flattenErrors = (obj: FieldErrors<any>, parent = ""): FieldIssue[] => {
    const result: FieldIssue[] = [];

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

  // A disabled submit button is a dead end unless the candidate can see what is
  // still outstanding, so derive it from the schema as they type rather than
  // waiting for a submit that cannot happen.
  const watchedValues = watch();
  // Parsing the whole schema on the keystroke that caused it makes typing in a
  // long text field stutter. Deferring lets React paint the character first and
  // recompute the summary behind it, and drops the parse entirely when several
  // keystrokes land inside one frame.
  const deferredValues = useDeferredValue(watchedValues);
  const outstanding = useMemo<FieldIssue[]>(() => {
    const result = jobApplicationSchema.safeParse(deferredValues);
    if (result.success) return [];

    const seen = new Set<string>();
    return result.error.issues.reduce<FieldIssue[]>((acc, issue) => {
      const path = issue.path.join(".");
      if (seen.has(path)) return acc;

      seen.add(path);
      acc.push({ path, message: issue.message });
      return acc;
    }, []);
  }, [deferredValues]);

  // If Manatal's field list omits something the schema requires, the candidate
  // is told to fix a field that was never rendered. Surface that to us instead
  // of letting them hit an unsatisfiable form.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const unreachable = outstanding.filter(
      (item) => !CONSENT_PATHS.has(item.path) && !document.getElementById(pathToFieldId(item.path)),
    );

    if (unreachable.length > 0) {
      console.warn(
        "[apply] required by the schema but no input is rendered, so these can never be satisfied:",
        unreachable.map((item) => item.path),
      );
    }
  }, [outstanding]);


  // Selected field by field rather than as a whole store object. Subscribing to
  // the store wholesale re-rendered the page every time the draft was written,
  // and the draft is written by this page -- so each save triggered the render
  // that scheduled the next one. The saved `values` are deliberately not
  // subscribed to at all; they are read once, on restore.
  const activeStep = useApplicationFormStore((state) => state.activeStep);
  const maxVisitedStep = useApplicationFormStore((state) => state.maxVisitedStep);
  const completedSteps = useApplicationFormStore((state) => state.completedSteps);
  const hydrated = useApplicationFormStore((state) => state.hydrated);
  const setActiveStep = useApplicationFormStore((state) => state.setActiveStep);
  const markStepCompleted = useApplicationFormStore((state) => state.markStepCompleted);
  const markStepIncomplete = useApplicationFormStore((state) => state.markStepIncomplete);
  const saveValues = useApplicationFormStore((state) => state.saveValues);
  const startJob = useApplicationFormStore((state) => state.startJob);
  const clearDraft = useApplicationFormStore((state) => state.clear);

  const isLastStep = activeStep === STEPS.length - 1;

  /** Used by the error summaries, whose entries may point at another step. */
  const scrollToField = (path: string) => focusFirstInvalidField([path]);

  /** Which step owns a schema path, or -1 when it belongs to none. */
  const stepForPath = (path: string) => {
    const root = path.split(".")[0];
    return STEP_FIELDS.findIndex((fields) => (fields as string[]).includes(root));
  };

  /** What is left to answer, in step order, for the summary above Submit. */
  const outstandingGroups = useMemo<OutstandingGroup[]>(() => {
    const byStep = new Map<number, FieldIssue[]>();

    outstanding.forEach((item) => {
      const step = stepForPath(item.path);
      if (step < 0) return;

      const bucket = byStep.get(step);
      if (bucket) bucket.push(item);
      else byStep.set(step, [item]);
    });

    return [...byStep.entries()]
      .sort(([a], [b]) => a - b)
      .map(([step, items]) => ({ step, title: STEPS[step].title, items }));
  }, [outstanding]);

  /**
   * Derived rather than recorded. `markStepIncomplete` only fires when a step
   * fails on the way out of it, so a step edited back into an invalid state
   * kept its green tick and the candidate had no idea where to look.
   * Steps ahead of the furthest one visited are left alone -- flagging an
   * untouched step red would be scolding someone for not having got there yet.
   */
  const invalidSteps = useMemo(
    () => outstandingGroups.map((group) => group.step).filter((step) => step <= maxVisitedStep),
    [outstandingGroups, maxVisitedStep],
  );

  /**
   * Sends the candidate to the first field that actually needs fixing rather
   * than to the top of the form. react-hook-form reports errors in schema
   * order, which is not the order the fields appear in, so pick by DOM
   * position. Falls back to the summary only when no error has a rendered
   * input - which would itself be a bug worth seeing.
   */
  const focusFirstInvalidField = (paths: string[]) => {
    const targets = paths
      .map((path) => ({ path, element: document.getElementById(pathToFieldId(path)) }))
      .filter((entry): entry is { path: string; element: HTMLElement } => Boolean(entry.element));

    // Nothing rendered means the field lives on another step, so go there first
    // instead of dumping the candidate at the top of the form with no clue.
    if (targets.length === 0) {
      const elsewhere = paths
        .map((path) => ({ path, step: stepForPath(path) }))
        .filter((entry) => entry.step >= 0)
        .sort((a, b) => a.step - b.step)[0];

      if (elsewhere) {
        setActiveStep(elsewhere.step);
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => {
            const element = document.getElementById(pathToFieldId(elsewhere.path));
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
            element?.focus?.({ preventScroll: true });
          }),
        );
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const first = targets.reduce((earliest, entry) =>
      earliest.element.compareDocumentPosition(entry.element) & Node.DOCUMENT_POSITION_PRECEDING
        ? entry
        : earliest,
    );

    first.element.scrollIntoView({ behavior: "smooth", block: "center" });
    first.element.focus?.({ preventScroll: true });
  };

  const onInvalid = (formErrors: FieldErrors<FormValues>) => {
    requestAnimationFrame(() => {
      focusFirstInvalidField(flattenErrors(formErrors).map((item) => item.path));
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
  const watchedDeclareTruth = watch("declare_truth");
  const watchedDeclareConsent = watch("declare_consent");
  const watchedIsReferred = watch("is_referred");
  const watchedIsApplyingForTeacher = watch("is_applying_for_teacher");
  const watchedDeclarations = watch("declarations");
  const watchedReferences = watch("references");
  const watchedResume = watch("resume");

  /** A resume the draft carried in, which the dropzone itself knows nothing about. */
  const hasRestoredResume = Boolean(watchedResume) && resumeProps.files.length === 0;

  const today = new Date().toISOString().split("T")[0];

  // Only guard work that would actually be lost. Unconditionally, this asked an
  // untouched form "are you sure you want to leave?" -- and asked it again on
  // the confirmation screen, after the application had already been sent.
  usePreventRefresh(isDirty && !submitSuccess);

  /**
   * The URL this effect last wrote. A resume restored from a draft was uploaded
   * in an earlier session, so the dropzone knows nothing about it even though
   * the file is still in the bucket -- and clearing the field just because
   * `successes` is empty threw that away the moment anything else nudged the
   * upload state.
   */
  const appliedResumeRef = useRef<string | null>(null);

  useEffect(() => {
    const uploadedUrl = resumeProps.successes[0];

    if (uploadedUrl) {
      appliedResumeRef.current = String(uploadedUrl);
      setValue("resume", String(uploadedUrl), {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    // Nothing uploaded in this session: only clear a URL this effect put there.
    // That is the file having been removed. A restored one is left alone.
    if (appliedResumeRef.current && getValues("resume") === appliedResumeRef.current) {
      appliedResumeRef.current = null;
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
      // selection would block submission for no reason.
      clearErrors("nricfin");
      return;
    }

    setValue("workpermitpass", "", { shouldDirty: true, shouldValidate: false });
    setValue("overseasaddress", "", { shouldDirty: true, shouldValidate: false });
  }, [watchedResidentialStatus, setValue, clearErrors]);



  /** A reference counts once the four fields the recruiter needs are filled. */
  const referenceFilled = (index: number) => {
    const r = watchedReferences?.[index];
    return Boolean(r?.name?.trim() && r?.email?.trim() && r?.contact_no?.trim() && r?.relationship?.trim());
  };

  const referenceCompletedCount = useMemo(() => {
    return (watchedReferences || []).filter(
      (r) => r?.name?.trim() && r?.email?.trim() && r?.contact_no?.trim() && r?.relationship?.trim(),
    ).length;
  }, [watchedReferences]);

  /**
   * Put one step's answers to Manatal and surface anything it will not take.
   *
   * The schema knows what this form requires; only Manatal knows what its own
   * fields accept, and it used to say so at submission -- a value typed on
   * step 1 was rejected on step 4, once the candidate thought they had
   * finished. Asking per step moves that answer to the field it is about.
   *
   * Returns true when the step may be left. A check that could not be run --
   * Manatal unreachable, the field list missing -- returns true as well: a
   * candidate who has done nothing wrong is never held up by our dependency,
   * and submission remains the backstop it has always been.
   */
  const manatalAcceptsStep = async (step: number): Promise<boolean> => {
    const stepKeys = new Set(STEP_FIELDS[step] as string[]);
    const values = getValues() as Record<string, unknown>;
    const payload: Record<string, unknown> = {};

    for (const field of MANATAL_FIELDS) {
      if (!stepKeys.has(field.key)) continue;

      const raw = values[field.key];
      const value = Array.isArray(raw) ? raw.join(",") : raw;

      if (typeof value !== "string" || value.trim() === "") continue;

      payload[manatalId(field.key, field.label, field.manatalId)] = value.trim();
    }

    if (Object.keys(payload).length === 0) return true;

    let problems: { id: string; message: string }[];

    try {
      const response = await fetch("/api/applications/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, application_data: payload }),
      });

      if (!response.ok) return true;

      const result = await response.json();
      if (!result?.checked) return true;

      problems = Array.isArray(result.problems) ? result.problems : [];
    } catch {
      return true;
    }

    if (problems.length === 0) return true;

    // Manatal names the field by id; the form knows it by key.
    const keyById = new Map(
      MANATAL_FIELDS.map((field) => [manatalId(field.key, field.label, field.manatalId), field.key]),
    );

    let attached = false;

    for (const problem of problems) {
      const key = keyById.get(problem.id);

      // A complaint we cannot pin to a field still has to be said out loud
      // rather than swallowed, or the step would refuse to advance in silence.
      if (!key || !stepKeys.has(key)) continue;

      setFormError(key as never, { type: "manatal", message: problem.message });
      attached = true;
    }

    if (!attached) {
      setError({
        error: "This step could not be accepted",
        details: problems.map((problem) => problem.message).join(" "),
      });
    }

    return false;
  };

  // A step may only be left once its own fields validate, so the candidate is
  // never carried past a mistake and told about it pages later.
  const goToStep = async (target: number) => {
    if (target === activeStep) return;

    // A step check is a round trip, and the rail stays clickable during it. Two
    // overlapping walks would fight over which step is active.
    if (checkingStep) return;

    setCheckingStep(true);

    try {
      await walkForwardTo(target);
    } finally {
      setCheckingStep(false);
    }
  };

  /** The forward walk, so `goToStep` can hold `checkingStep` across all of it. */
  const walkForwardTo = async (target: number) => {
    if (target > activeStep) {
      // Every step being skipped, not just the one underfoot. The rail allows a
      // jump to any step already visited, so going back to fix something and
      // then jumping forward used to sail straight over the step just broken --
      // leaving Submit disabled with nothing to say why.
      for (let step = activeStep; step < target; step++) {
        const valid = await trigger(STEP_FIELDS[step] as never);

        // The schema is satisfied; ask Manatal whether it will actually take
        // these answers. Only then is the step genuinely behind the candidate.
        if (valid && !(await manatalAcceptsStep(step))) {
          markStepIncomplete(step);
          if (step !== activeStep) setActiveStep(step);

          const stepPaths = new Set(STEP_FIELDS[step] as string[]);
          const onThisStep = flattenErrors(methods.formState.errors)
            .map((item) => item.path)
            .filter((path) => stepPaths.has(path.split(".")[0]));

          requestAnimationFrame(() => focusFirstInvalidField(onThisStep));
          return;
        }

        if (valid) {
          markStepCompleted(step);
          continue;
        }

        markStepIncomplete(step);
        // Only when the failure is on a step being skipped over. Re-setting the
        // step underfoot still writes a new store state, and the render that
        // follows lands after the focus below and takes it away again.
        if (step !== activeStep) setActiveStep(step);

        // Read back from the validation that just ran, not from `outstanding`:
        // that one is derived from a deferred snapshot of the values, so a
        // click landing in the same frame as the last keystroke would aim at a
        // field the candidate had already filled in.
        const stepPaths = new Set(STEP_FIELDS[step] as string[]);
        const onThisStep = flattenErrors(methods.formState.errors)
          .map((item) => item.path)
          .filter((path) => stepPaths.has(path.split(".")[0]));

        requestAnimationFrame(() => focusFirstInvalidField(onThisStep));
        return;
      }
    }

    setActiveStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * The pending debounced write, held at component scope so submission can
   * cancel it. A save armed by the last keystroke before Submit would otherwise
   * land *after* the draft was cleared whenever the round-trip came back inside
   * 500ms, writing an NRIC, a passport number and a date of birth back into
   * storage for a form the candidate had already sent.
   */
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savingStoppedRef = useRef(false);

  // Restore once, after the persisted draft has been merged in, so the form
  // does not reset itself over the draft on first paint. Keyed by job: nothing
  // in the router guarantees this component is torn down when the id changes,
  // and a restore that did not re-run would leave one job's answers sitting in
  // another job's form, to be saved back under the new id.
  const restoredForJobRef = useRef<string | null>(null);

  // Drafts are per job, so a stored draft for another job is discarded.
  useEffect(() => {
    if (jobId) startJob(String(jobId));
  }, [jobId, startJob]);

  useEffect(() => {
    if (!hydrated || restoredForJobRef.current === jobId) return;

    restoredForJobRef.current = jobId;
    savingStoppedRef.current = false;
    const defaults = buildDefaultValues();
    const draftValues = useApplicationFormStore.getState().values;

    reset(draftValues ? mergeDraft(defaults, draftValues) : defaults);
  }, [hydrated, jobId, reset]);

  // Persist as they go. Debounced so typing does not write on every keystroke.
  // Driven by the form's own subscription rather than by a `watch()` snapshot:
  // a snapshot is a fresh object on every render, so the effect re-armed itself
  // each time it ran and an untouched form kept saving itself forever.
  useEffect(() => {
    if (!hydrated || restoredForJobRef.current === null) return;

    const subscription = watch((values) => {
      clearTimeout(saveTimerRef.current);
      if (savingStoppedRef.current) return;

      saveTimerRef.current = setTimeout(() => saveValues(values as never), 500);
    });

    return () => {
      clearTimeout(saveTimerRef.current);
      subscription.unsubscribe();
    };
    // `hydrated` is what re-runs this: the restore effect above is declared
    // first, so it has already set `restoredForJobRef` by the time this runs on
    // that same commit.
  }, [watch, hydrated, saveValues]);

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

      MANATAL_FIELDS.forEach((field) => {
        const value = dynamicValues[field.key];
        let finalValue: any = "";

        if (typeof value === "string") {
          finalValue = value.trim();

          if (field.key === "expected_salary" && finalValue) {
            expectedCurrencyId = "13";
          }
        } else if (typeof value === "number" || typeof value === "boolean") {
          finalValue = value;
        } else if (value == null) {
          finalValue = "";
        } else {
          finalValue = value;
        }

        applicationData[manatalId(field.key, field.label, field.manatalId)] = finalValue;
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

      applicationData[manatalId("familyparticulars", "Family Particulars", "1741709")] =
        formatFamilyParticularsToHTML(trimmedFamilyMembers);
      applicationData[manatalId("skipbackgroundcheck", "Skip Background Check", "1771366")] =
        normalizedValues.skipbackgroundcheck;
      applicationData[manatalId("rcbcrequestissued", "RC/BC Request Issued", "1771465")] =
        normalizedValues.rcbcrequestissued;
      applicationData[manatalId("bcrequestissued", "BC Request Issued", "1771466")] =
        normalizedValues.bcrequestissued;

      const formattedEducations = formatEducations(normalizedValues.educations);

      const educationField = sectionFields.find((field) =>
        matchesSection(field, "educations", "education", "educational_profile", "educationalprofile"),
      );

      if (educationField && formattedEducations.length) {
        applicationData[String(educationField.id)] = formattedEducations;
      }

      const formattedExperiences = formatExperiences(normalizedValues.experiences);

      const experienceField = sectionFields.find((field) =>
        matchesSection(field, "experiences", "experience", "employment_history", "employmenthistory", "work_experience"),
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

      applicationData[manatalId("referencedetails", "Character References", "1741707")] =
        formatReferencesToHTML(validReferences);

      const declarationMap = normalizedValues.declarations.reduce<
        Record<number, { answer: "Yes" | "No"; details?: string }>
      >((acc, item, index) => {
        acc[index] = {
          answer: item.answer,
          details: item.details || "",
        };
        return acc;
      }, {});

      applicationData[manatalId("declarationdetails", "Declaration", "1741708")] =
        generateDeclarationList(declarationMap);

      if (normalizedValues.resume?.trim()) {
        applicationData[manatalId("resume", "Resume", "1741683")] = normalizedValues.resume.trim();
      } else {
        throw new Error("Please upload a resume file");
      }

      if (normalizedValues.workpermitpass?.trim()) {
        applicationData[manatalId("workpermitpass", "Work Pass", "1741698")] = normalizedValues.workpermitpass.trim();
      }

      if (normalizedValues.overseasaddress?.trim()) {
        applicationData[manatalId("overseasaddress", "Overseas Complete Address", "1741691")] =
          normalizedValues.overseasaddress.trim();
      }

      applicationData[manatalId("industries", "Work Industry", "1741702")] = values.industries.join(",");

      applicationData.organization_name = job?.org_name ?? "";
      applicationData.position_name = job?.position_name ?? "";
      applicationData.job_id = jobId;
      applicationData.job_portal = readJobPortal();
      applicationData.referrer_email = normalizedValues.is_referred
        ? (normalizedValues.referrer_details?.referrer_email ?? "")
        : "";
      applicationData.referrer_name = normalizedValues.is_referred
        ? (normalizedValues.referrer_details?.referrer_name ?? "")
        : "";

      formDataToSend.append("application_data", JSON.stringify(applicationData));
      formDataToSend.append("jobId", jobId);
      // The route swaps the nationality demonym for Manatal's numeric id, so it
      // needs to know which key holds it. Sent from here because the resolved id
      // is only known on this side.
      formDataToSend.append("nationality_field_id", manatalId("nationalities", "Nationality", "1742127"));

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

      // Order matters: stop the autosave and drop any write it already armed
      // before clearing, or the draft reappears a few hundred milliseconds later.
      savingStoppedRef.current = true;
      clearTimeout(saveTimerRef.current);
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


  return (
    <>
      {submitting && <SubmittingOverlay />}

      {/* `data-interactive` is read by a rule in globals.css that holds clicks
          off every button until React has attached. It sits here rather than on
          the form because the Back/Continue/Submit bar lives outside it. */}
      {/* `data-checking-step` says a step is being put to Manatal, so a test can
          wait the round trip out rather than reading a step mid-transition. */}
      <div
        className="min-h-screen bg-[#EFF1F6]"
        data-interactive={interactive}
        data-checking-step={checkingStep}>
        {/* The navy job bar is this page's header; the stepper rides with it */}
        <div className="sticky top-0 z-40">
        <div className="bg-[#1B2A8F] px-4 py-4 shadow-[0_1px_0_#E1E5F0] sm:px-[30px] sm:py-7">
          <div className="mx-auto flex max-w-[1060px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-[7px] text-[13px] font-medium text-white transition-colors hover:text-[#C3C9DC]">
              <ChevronLeft className="size-[15px]" />
              Back to listings
            </Link>

            <div className="flex items-center gap-4 sm:gap-5">
              <div className="min-w-0 flex-1 sm:flex-none sm:text-right">
                <h1 className="truncate text-[18px] font-semibold leading-[1.2] tracking-[-0.03em] text-white sm:text-[22px]">
                  {job?.position_name || "Open Position"}
                </h1>
                <div className="mt-[5px] flex flex-wrap items-center gap-[9px] text-[12px] text-white sm:justify-end sm:text-[13px]">
                  {job?.org_website ? (
                    <Link href={job.org_website} target="_blank" className="font-medium text-white hover:underline">
                      {job?.org_name || "Company"}
                    </Link>
                  ) : (
                    <span className="font-medium">{job?.org_name || "Company"}</span>
                  )}
                  {job?.location && (
                    <>
                      <span className="text-[#C3C9DC]">&middot;</span>
                      <span className="inline-flex items-center gap-[5px]">
                        <MapPin className="size-3 text-white" />
                        {job.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-[10px] border sm:size-14 border-[#E3E6F0] bg-white shadow-[0_1px_3px_rgba(16,22,43,0.08)]">
                {job?.org_logo ? (
                  <Image
                    src={job.org_logo}
                    alt={job.org_name ?? "Organization logo"}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="text-[17px] font-semibold text-[#6C7591]">{job?.org_name?.charAt(0) || "C"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stepper band — the second half of the page header */}
        {!submitSuccess && (
          <div className="border-t border-[#ECEFF7] bg-white px-4 py-3 shadow-[0_1px_0_#E1E5F0,0_3px_10px_rgba(16,22,43,0.04)] sm:px-[30px] sm:py-[18px]">
            {/* Four rows of steps would swallow a phone screen, so small screens
                get the current step as a menu; the full rail returns at md. */}
            <Popover open={stepMenuOpen} onOpenChange={setStepMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Step ${activeStep + 1} of ${STEPS.length}: ${STEPS[activeStep]?.title}. Change step`}
                  className="mx-auto flex w-full max-w-[1060px] items-center gap-3 rounded-[10px] text-left md:hidden">
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1E2FA8] text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(30,47,168,0.32)]">
                    {activeStep + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[#10162B]">
                      {STEPS[activeStep]?.title}
                    </span>
                    <span className="block truncate text-[12px] text-[#6C7591]">{STEPS[activeStep]?.description}</span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-1 text-[12px] font-medium text-[#6C7591]">
                    {activeStep + 1}/{STEPS.length}
                    <ChevronDown className="size-4" />
                  </span>
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="center"
                sideOffset={10}
                className="w-[var(--radix-popover-trigger-width)] rounded-[10px] border-[#E1E5F0] bg-white p-2 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] md:hidden">
                <Stepper
                  orientation="vertical"
                  steps={STEPS}
                  activeStep={activeStep}
                  onStepChange={(index) => {
                    setStepMenuOpen(false);
                    goToStep(index);
                  }}
                  completedSteps={completedSteps}
                  invalidSteps={invalidSteps}
                  maxNavigableStep={maxVisitedStep}
                />
              </PopoverContent>
            </Popover>

            <div className="hidden md:block">
              <Stepper
                steps={STEPS}
                activeStep={activeStep}
                onStepChange={goToStep}
                completedSteps={completedSteps}
                invalidSteps={invalidSteps}
                maxNavigableStep={maxVisitedStep}
                className="mx-auto w-full max-w-[1060px]"
              />
            </div>
          </div>
        )}
        </div>

        <div className="mx-auto max-w-[1120px] px-4 pb-8 pt-4 sm:px-[30px] sm:pb-10 sm:pt-[26px]">

          {submitSuccess ? (
            <div className={`${cardBase} p-16 text-center`}>
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border-4 border-[#CDEFE1] bg-[#E7F6EF]">
                <svg
                  className="size-10 text-[#10A56B]"
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
              <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.03em] text-[#10162B]">Application Submitted!</h2>
              <p className="mb-8 text-[13px] leading-[1.65] text-[#4A5273]">
                Thank you for applying. We&apos;ll review your application and be in touch soon.
              </p>
              <button
                onClick={() => router.push("/")}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-[26px] py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110">
                Browse More Jobs
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <ApplicationNote />
              </div>
              {/* noValidate: validation is owned by Zod + react-hook-form. Native
                  constraint validation would cancel submission before the submit
                  event fires, so handleSubmit/onInvalid never run and the user
                  sees nothing happen. */}
              <FormProvider {...methods}>
              <form
                id={FORM_ID}
                noValidate
                onSubmit={handleSubmit(onSubmit, onInvalid)}
                className="space-y-4">
                {error && (
                  <div
                    ref={errorBannerRef}
                    className="flex flex-col gap-1 rounded-[9px] border border-[#F6D6B8] bg-[#FDECD9] p-4 text-[13px] text-[#8A3D0B]">
                    <div className="font-semibold">{error.error}</div>
                    {error.details && <div className="text-[#A4551C]">{error.details}</div>}
                  </div>
                )}

                {activeStep === 0 && (
                  <>
                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="01"
                    title="Application Information"
                    subtitle="Basic details about this application"
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ApplicationFormField name="expected_salary" />
                    <ApplicationFormField name="years_of_experience" />
                    <ApplicationFormField name="linkedin" />
                    <ApplicationFormField name="industries" />
                    <ApplicationFormField
                      name="resume"
                      className="md:col-span-2"
                      slot={
                        <div id={pathToFieldId("resume")} tabIndex={-1} className="mt-1">
                          <Dropzone {...resumeProps}>
                            <DropzoneEmptyState />
                            <DropzoneContent />
                          </Dropzone>
                          {/* The dropzone only knows about files dropped on it
                              this session, so a resume carried in on a restored
                              draft would show as nothing at all. */}
                          {hasRestoredResume && (
                            <p className="mt-2 text-[12px] text-[#4A5273]">
                              A resume from your saved draft is attached.{" "}
                              <a
                                href={String(watchedResume)}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-[#1E2FA8] underline underline-offset-2">
                                View it
                              </a>
                              , or upload another to replace it.
                            </p>
                          )}
                        </div>
                      }
                    />

                    <div
                      className={`md:col-span-2 rounded-[9px] border px-4 py-3.5 transition-all duration-200 ${
                        watchedIsReferred ? "border-[#C3CBE8] bg-[#F7F9FF]" : "border-[#E4E7F1] bg-[#F7F8FC]"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                              watchedIsReferred ? "bg-[#1E2FA8]" : "bg-[#EDEFF6]"
                            }`}>
                            <svg
                              className={`w-4 h-4 ${watchedIsReferred ? "text-white" : "text-[#6C7591]"}`}
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
                            <p className="text-[13px] font-semibold text-[#10162B]">
                              Were you referred by an HFSE employee?
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#6C7591]">
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
                                field.value ? "bg-[#1E2FA8]" : "bg-[#D5DAE8]"
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
                        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#D3D9F7] pt-4 md:grid-cols-2">
                          <div>
                            <Label required>Referrer Name</Label>
                            <Input
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
                            <Input
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
                  className={`rounded-xl p-6 transition-all duration-200 ${
                    watchedIsApplyingForTeacher
                      ? "border border-[#C3CBE8] bg-[#F7F9FF] shadow-[0_1px_2px_rgba(16,22,43,0.05)]"
                      : "bg-white shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex size-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                          watchedIsApplyingForTeacher ? "bg-[#1E2FA8]" : "bg-[#EDEFF6]"
                        }`}>
                        <svg
                          className={`w-4 h-4 ${watchedIsApplyingForTeacher ? "text-white" : "text-[#6C7591]"}`}
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
                        <h3 className="text-[15px] font-semibold leading-tight text-[#10162B]">
                          For Teacher Position Only
                        </h3>
                        <p className="mt-0.5 text-[11px] text-[#6C7591]">
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
                            field.value ? "bg-[#1E2FA8]" : "bg-[#D5DAE8]"
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
                    <div className="mt-5 border-t border-[#D3D9F7] pt-5">
                      <ApplicationFormField
                        name="preferredsubjectsandlevels"
                        required
                        description="List each subject and its corresponding level(s), one per line if needed"
                      />
                    </div>
                  )}
                </div>

                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="02"
                    title="Personal Information"
                    subtitle="Your personal details and identification"
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ApplicationFormField name="full_name" />
                    <ApplicationFormField name="preferredname" />
                    <ApplicationFormField name="residentialstatus" />
                    <ApplicationFormField name="nationalities" />

                    {watchedResidentialStatus === "Foreigner" && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[#F7F9FF] border border-[#D3D9F7] rounded-xl">
                        <div className="flex items-start gap-2.5 md:col-span-2 mb-1">
                          <svg
                            className="w-4 h-4 text-[#1E2FA8] flex-shrink-0 mt-0.5"
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
                          <p className="text-[11px] font-medium text-[#1E2FA8]">
                            Additional information required for foreign applicants
                          </p>
                        </div>

                        <ApplicationFormField name="workpermitpass" required />

                        <ApplicationFormField name="overseasaddress" required />
                      </div>
                    )}
                    <ApplicationFormField name="birth_date" />
                    <ApplicationFormField name="gender" />
                    <ApplicationFormField name="religion" />
                    {<ApplicationFormField name="nricfin" required={isNricFinRequired} />}
                    <ApplicationFormField name="latest_degree" />

                    <ApplicationFormField name="passportno" />
                    <ApplicationFormField name="placedateofissue" className="md:col-span-2" />
                  </div>
                </div>

                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader number="03" title="Contact Information" subtitle="How we can reach you" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ApplicationFormField name="phone_number" />
                    <ApplicationFormField name="email" />
                    <ApplicationFormField name="address" />

                    <ApplicationFormField name="postalcode" />
                  </div>
                </div>

                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="04"
                    title="Person to Contact in Case of Emergency"
                    subtitle="Someone we can reach if needed"
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ApplicationFormField name="name" />
                    <ApplicationFormField name="relationship" />
                    {<ApplicationFormField name="address_b" className={"md:col-span-2"} />}
                    <ApplicationFormField name="mobilenumber" />
                    <ApplicationFormField name="hometelephonenumber" />
                    <ApplicationFormField name="officetelephonenumber" />
                    <ApplicationFormField name="emailaddress" />
                  </div>
                </div>

                  </>
                )}

                {activeStep === 1 && (
                  <>
                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="05"
                    title="Family Particulars"
                    subtitle="Details of immediate family members"
                  />
                  <div className="space-y-4">
                    {familyFields.map((member, i) => (
                      <div key={member.id} className="rounded-[10px] border border-[#E4E7F1] bg-[#FBFCFE] p-3.5 sm:p-[18px]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6C7591]">
                            Member {i + 1}
                          </span>
                          {familyFields.length > 1 && <RemoveButton onClick={() => removeFamily(i)} />}
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <Label>Name</Label>
                            <Input
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
                            <Input
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
                                <Input
                                  id={pathToFieldId(`family_members.${i}.age`)}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                  className={inputBase}
                                  placeholder="e.g. 45"
                                />
                              )}
                            />
                            <ErrorText path={`family_members.${i}.age`} />
                          </div>

                          <div>
                            <Label>Occupation</Label>
                            <Input
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
                            <Input
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
                        appendFamily(
                          {
                            name: "",
                            relationship: "",
                            nationality: "",
                            age: "",
                            occupation: "",
                            company: "",
                          },
                          NO_FOCUS,
                        )
                      }
                      label="Add Family Member"
                    />
                  </div>
                </div>

                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="06"
                    title="Educational Profile"
                    subtitle="Your academic background and qualifications"
                  />
                  <div className="space-y-4">
                    {educationFields.map((edu, i) => (
                      <div key={edu.id} className="rounded-[10px] border border-[#E4E7F1] bg-[#FBFCFE] p-3.5 sm:p-[18px]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6C7591]">
                            Education {i + 1}
                          </span>
                          {educationFields.length > 1 && <RemoveButton onClick={() => removeEducation(i)} />}
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                          <div>
                            <Label required>School / Institution</Label>
                            <Input
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
                            <Input
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
                            <Input
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
                            <Textarea
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
                        appendEducation(
                          {
                            school: "",
                            degree_name: "",
                            specialization: "",
                            started_at: "",
                            ended_at: null,
                            location: "",
                            description: "",
                          },
                          NO_FOCUS,
                        )
                      }
                      label="Add Education"
                    />
                  </div>
                </div>

                {(
                  <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                    <SectionHeader
                      number="07"
                      title="Other Courses Currently Pursuing"
                      subtitle="Any ongoing studies or certifications"
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {<ApplicationFormField name="coursename" className={"md:col-span-2"} />}
                      <ApplicationFormField name="coursestartdate" />
                      <ApplicationFormField name="expectedyearofcompletion" />
                    </div>
                  </div>
                )}

                  </>
                )}

                {activeStep === 2 && (
                  <>
                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="08"
                    title="Employment History"
                    subtitle="Your work experience, most recent first"
                  />
                  <div className="space-y-4">
                    {experienceFields.map((exp, i) => {
                      const isCurrent = watch(`experiences.${i}.is_current_employer`);

                      return (
                        <div key={exp.id} className="rounded-[10px] border border-[#E4E7F1] bg-[#FBFCFE] p-3.5 sm:p-[18px]">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6C7591]">
                              Experience {i + 1}
                            </span>
                            {experienceFields.length > 1 && <RemoveButton onClick={() => removeExperience(i)} />}
                          </div>

                          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
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
                              <Input
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
                              <Input
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
                              <Input
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
                              <Input
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
                              <Textarea
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
                                  <UiLabel
                                    className={`flex w-full cursor-pointer select-none items-center gap-2.5 rounded-lg border px-[14px] py-[11px] text-[13px] font-medium transition-colors ${
                                      field.value
                                        ? "border-[#C3CBE8] bg-[#E7EAFB] text-[#16217A]"
                                        : "border-[#D5DAE8] bg-white text-[#4A5273] hover:border-[#C8CEE0]"
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
                                    <span
                                      className={`flex size-[18px] flex-shrink-0 items-center justify-center rounded-[4px] border ${
                                        field.value ? "border-[#1E2FA8] bg-[#1E2FA8]" : "border-[#B9C2D9] bg-white"
                                      }`}>
                                      {field.value && (
                                        <svg
                                          className="size-3 text-white"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth={3.5}
                                          strokeLinecap="round"
                                          strokeLinejoin="round">
                                          <path d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </span>
                                    I currently work here
                                  </UiLabel>
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
                        appendExperience(
                          {
                            title: "",
                            employer: "",
                            salary: "",
                            started_at: "",
                            ended_at: null,
                            is_current_employer: false,
                            description: "",
                          },
                          NO_FOCUS,
                        )
                      }
                      label="Add Experience"
                    />
                  </div>
                </div>

                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="09"
                    title="Additional Information"
                    subtitle="Other details relevant to your application"
                  />
                  <div className="flex flex-col gap-4">
                    <ApplicationFormField name="membershipsassociations" />
                    <ApplicationFormField name="description" />
                  </div>
                </div>

                  </>
                )}

                {activeStep === 3 && (
                  <>
                <div className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="10"
                    title="Declaration"
                    subtitle="Please answer all questions honestly. All information is kept confidential."
                  />
                  <div className="space-y-2.5">
                    {declarationQuestions.map((question, i) => {
                      const current = watchedDeclarations?.[i];
                      const needsDetails = current?.answer === "Yes";

                      return (
                        <div
                          key={i}
                          className={`rounded-[9px] border px-4 py-3.5 transition-colors ${
                            needsDetails ? "border-[#C3CBE8] bg-[#F7F9FF]" : "border-[#E4E7F1] bg-[#FBFCFE]"
                          }`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                          <p className="max-w-[720px] text-[13px] leading-[1.6] text-[#22283F]">
                            <span className="mr-[7px] font-semibold text-[#8A92AB]">{i + 1}.</span>
                            {question}
                            <span className="ml-1 text-[#C2410C]">*</span>
                          </p>

                          <div
                            id={pathToFieldId(`declarations.${i}.answer`)}
                            tabIndex={-1}
                            className="flex flex-shrink-0 gap-1.5">
                            {(["Yes", "No"] as const).map((option) => (
                              <UiLabel
                                key={option}
                                className={`flex min-h-[34px] cursor-pointer select-none items-center justify-center rounded-md border px-[18px] text-[12px] font-semibold transition-colors ${
                                  current?.answer === option
                                    ? "border-[#1E2FA8] bg-[#1E2FA8] text-white shadow-[0_1px_3px_rgba(30,47,168,0.3)]"
                                    : "border-[#D5DAE8] bg-white text-[#4A5273] hover:border-[#C8CEE0]"
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
                                {option}
                              </UiLabel>
                            ))}
                          </div>
                          </div>
                          <ErrorText path={`declarations.${i}.answer`} />

                          {needsDetails && (
                            <div className="mt-3">
                              <Label required>Please provide details</Label>
                              <Textarea
                                id={pathToFieldId(`declarations.${i}.details`)}
                                rows={2}
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

                <div id={pathToFieldId("references.root")} className={`${cardBase} px-4 py-5 sm:px-[26px] sm:py-6`}>
                  <SectionHeader
                    number="11"
                    title="Character References"
                    aside={
                      <span
                        className={`flex-shrink-0 rounded-md border px-[11px] py-1 text-[12px] font-semibold ${
                          referenceCompletedCount >= MIN_REFERENCES
                            ? "border-[#A9E4CC] bg-[#E7F6EF] text-[#0B7A4F]"
                            : "border-[#F6D6B8] bg-[#FDECD9] text-[#8A3D0B]"
                        }`}>
                        {Math.min(referenceCompletedCount, MIN_REFERENCES)} of {MIN_REFERENCES} completed
                      </span>
                    }
                  />

                  <div className="space-y-4">
                    {referenceFields.map((ref, i) => (
                      <div
                        key={ref.id}
                        className={`relative rounded-[10px] border p-3.5 transition-colors sm:p-[18px] ${
                          referenceFilled(i) ? "border-[#CDEFE1] bg-[#F7FCFA]" : "border-[#E4E7F1] bg-[#FBFCFE]"
                        }`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6C7591]">
                              Reference {i + 1}
                            </span>
                            {i >= MIN_REFERENCES ? (
                              <span className="rounded-md border border-[#E3E6F0] bg-[#F2F4FA] px-2 py-0.5 text-[11px] font-medium text-[#6C7591]">
                                Optional
                              </span>
                            ) : (
                              referenceFilled(i) && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B7A4F]">
                                  <CheckCircle2 className="size-3.5" />
                                  Complete
                                </span>
                              )
                            )}
                          </span>
                          {referenceFields.length > MIN_REFERENCES && <RemoveButton onClick={() => removeReference(i)} />}
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <Label required>Name</Label>
                            <Input
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
                            <Input
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

                            <Input
                              id={pathToFieldId(`references.${i}.contact_no`)}
                              type="tel"
                              {...register(`references.${i}.contact_no`)}
                              className={inputBase}
                              placeholder="+65 9123 4567"
                            />
                            <ErrorText path={`references.${i}.contact_no`} />
                          </div>

                          <div className="lg:col-span-2">
                            <Label required>Company &amp; Occupation</Label>
                            <Input
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

                            <Input
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
                            <Input
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
                                  <UiLabel
                                    key={value}
                                    className={`flex min-h-[40px] cursor-pointer select-none items-center gap-2 rounded-md border px-[18px] text-[12px] font-semibold transition-colors ${
                                      isSelected
                                        ? "border-[#1E2FA8] bg-[#1E2FA8] text-white shadow-[0_1px_3px_rgba(30,47,168,0.3)]"
                                        : "border-[#D5DAE8] bg-white text-[#4A5273] hover:border-[#C8CEE0]"
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
                                  </UiLabel>
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
                        appendReference(
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
                          NO_FOCUS,
                        )
                      }
                      label="Add another reference"
                    />
                    {referenceCompletedCount >= MIN_REFERENCES && (
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B7A4F]">
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
                  declareConsent={watchedDeclareConsent}
                  declareTruth={watchedDeclareTruth}
                  setDeclareConsent={(v) => setValue("declare_consent", v, { shouldValidate: true, shouldDirty: true })}
                  setDeclareTruth={(v) => setValue("declare_truth", v, { shouldValidate: true, shouldDirty: true })}
                />

                {outstandingGroups.length > 0 && (
                  <OutstandingSummary groups={outstandingGroups} onJump={scrollToField} />
                )}

                {/* The artboard keeps only this reassurance here; Submit lives in the footer bar. */}
                <div className="flex items-start gap-3 rounded-xl bg-white px-[26px] py-5 text-[13px] leading-[1.65] text-[#4A5273] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
                  <span className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-full border border-[#CDEFE1] bg-[#E7F6EF]">
                    <ShieldCheck className="size-4 text-[#0B7A4F]" />
                  </span>
                  <p className="max-w-xl text-balance">
                    By submitting, you confirm that all information provided is{" "}
                    <span className="font-medium text-[#414A66]">accurate</span> and complete. You won’t be able to edit
                    this after submission.
                  </p>
                </div>
                  </>
                )}
              </form>
              </FormProvider>
            </>
          )}
        </div>

        {/* Footer nav bar — white strip across the page, content on the 1060 column */}
        {!submitSuccess && (
          <div className="sticky bottom-0 z-40 border-t border-[#E1E5F0] bg-white px-4 py-3 sm:px-[30px] sm:py-3.5 shadow-[0_-2px_10px_rgba(16,22,43,0.05)]">
            <div className="mx-auto flex max-w-[1060px] items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(activeStep - 1)}
                disabled={activeStep === 0}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-[7px] border border-[#D5DAE8] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#10162B] shadow-[0_1px_2px_rgba(16,22,43,0.05)] transition-colors hover:bg-[#F7F8FC] sm:px-[22px] disabled:border-[#E1E5F0] disabled:bg-[#F5F6FA] disabled:text-[#A6ADC2]">
                <ArrowLeft className="size-4" />
                Back
              </button>

              <span className="text-[12px] text-[#6C7591]">
                Step {activeStep + 1} of {STEPS.length}
              </span>

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => goToStep(activeStep + 1)}
                  // Leaving a step now waits on Manatal. Without this the button
                  // looked inert for the length of a round trip and a second
                  // click queued a second check.
                  disabled={checkingStep}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-[26px] py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#8D97C9] disabled:bg-none disabled:shadow-none">
                  {checkingStep ? (
                    <>
                      <Spinner className="size-4" />
                      Checking
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  form={FORM_ID}
                  disabled={submitting || !isValid}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-[30px] py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#8D97C9] disabled:bg-none disabled:shadow-none">
                  {submitting ? (
                    <>
                      <Spinner className="size-4" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowUpRight className="size-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
