"use client";

import type { JobApplicationFormInput } from "@/lib/validators/job-application";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

// The form is read with getValues(), which yields the schema INPUT type (before
// Zod applies defaults), so the draft is typed against that rather than output.
export type ApplicationDraft = Partial<JobApplicationFormInput>;

type ApplicationFormState = {
  /** Which job the persisted draft belongs to, so drafts never leak across jobs. */
  jobId: string | null;
  activeStep: number;
  maxVisitedStep: number;
  completedSteps: number[];
  values: ApplicationDraft | null;
  /** False until the persisted draft has been merged in, so the form does not
   *  reset itself over a restored draft on first paint. */
  hydrated: boolean;

  setActiveStep: (index: number) => void;
  markStepCompleted: (index: number) => void;
  markStepIncomplete: (index: number) => void;
  saveValues: (values: ApplicationDraft) => void;
  /** Drops the draft when the stored one belongs to a different job. */
  startJob: (jobId: string) => void;
  setHydrated: () => void;
  clear: () => void;
};

const emptyDraft = {
  jobId: null as string | null,
  activeStep: 0,
  maxVisitedStep: 0,
  completedSteps: [] as number[],
  values: null as ApplicationDraft | null,
};

/**
 * Bump this whenever the saved shape changes -- a renamed field, a new required
 * one, a different array seed. A draft lives as long as the tab, so a deploy
 * mid-session can hand an old shape to a new form; the candidate then sees
 * fields that fail validation with nothing on screen to explain why. Dropping
 * the draft costs them their typing once. Merging a stale one costs them the
 * application.
 */
const DRAFT_VERSION = 1;

/** Stands in wherever real storage cannot be reached, so nothing has to branch. */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * sessionStorage throws in two separate places: on access (Safari private
 * browsing, third-party storage blocked inside the embed iframe) and on write
 * (QuotaExceededError). createJSONStorage only guards the first, and an
 * uncaught write would surface from inside the debounced save -- a keystroke
 * taking the whole form down. Losing the draft is survivable; that is not.
 */
const safeSessionStorage = (): StateStorage => {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  try {
    window.sessionStorage.getItem("hfse-application-draft-probe");
  } catch {
    // Reading it threw, so the whole store is off limits. Hand back a sink
    // rather than nothing: rehydration still completes, and the form stops
    // waiting on a draft that is never coming.
    return noopStorage;
  }

  return {
    getItem: (name) => {
      try {
        return window.sessionStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        window.sessionStorage.setItem(name, value);
      } catch {
        // Over quota or blocked mid-session: carry on unpersisted.
      }
    },
    removeItem: (name) => {
      try {
        window.sessionStorage.removeItem(name);
      } catch {
        // Nothing to do -- the draft is already unreachable.
      }
    },
  };
};

export const useApplicationFormStore = create<ApplicationFormState>()(
  persist(
    (set, get) => ({
      ...emptyDraft,
      hydrated: false,

      setActiveStep: (index) =>
        set((state) => ({
          activeStep: index,
          maxVisitedStep: Math.max(state.maxVisitedStep, index),
        })),

      markStepCompleted: (index) =>
        set((state) =>
          state.completedSteps.includes(index)
            ? state
            : { completedSteps: [...state.completedSteps, index].sort((a, b) => a - b) },
        ),

      markStepIncomplete: (index) =>
        set((state) => ({ completedSteps: state.completedSteps.filter((step) => step !== index) })),

      saveValues: (values) => set({ values }),

      startJob: (jobId) => {
        if (get().jobId === jobId) {
          return;
        }
        set({ ...emptyDraft, jobId });
      },

      setHydrated: () => set({ hydrated: true }),

      clear: () => set({ ...emptyDraft }),
    }),
    {
      name: "hfse-application-draft",
      version: DRAFT_VERSION,
      // A draft from an older build is discarded rather than migrated field by
      // field: the form reseeds itself from its own defaults on the next save.
      migrate: () => ({ ...emptyDraft }),
      // sessionStorage: the draft survives a refresh or an accidental back
      // navigation, but does not linger on a shared machine once the tab closes.
      // Every access is wrapped, so the form simply runs unpersisted when
      // storage is unavailable (SSR, Safari private browsing) or full.
      storage: createJSONStorage(safeSessionStorage),
      // `hydrated` is left out so it always starts false on a fresh page.
      partialize: ({ jobId, activeStep, maxVisitedStep, completedSteps, values }) => ({
        jobId,
        activeStep,
        maxVisitedStep,
        completedSteps,
        values,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
