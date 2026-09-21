"use client";

import type { JobApplicationFormInput } from "@/lib/validators/job-application";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
      // sessionStorage: the draft survives a refresh or an accidental back
      // navigation, but does not linger on a shared machine once the tab closes.
      // createJSONStorage swallows the access error when storage is unavailable
      // (SSR, Safari private browsing), so the form simply runs unpersisted.
      storage: createJSONStorage(() => sessionStorage),
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
