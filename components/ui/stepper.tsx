"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, Check, ChevronRight } from "lucide-react";

export type StepperStep = {
  id: string;
  title: string;
  description?: string;
};

type StepperProps = {
  steps: StepperStep[];
  activeStep: number;
  onStepChange: (index: number) => void;
  /** Steps the user has completed and validated. */
  completedSteps?: number[];
  /** Steps the user has visited that still hold validation errors. */
  invalidSteps?: number[];
  /** Furthest step the user is allowed to jump to. Defaults to the active step. */
  maxNavigableStep?: number;
  /** Vertical reads as a table of contents in a side rail; horizontal as a bar. */
  orientation?: "horizontal" | "vertical";
  className?: string;
};

function Stepper({
  steps,
  activeStep,
  onStepChange,
  completedSteps = [],
  invalidSteps = [],
  maxNavigableStep,
  orientation = "horizontal",
  className,
}: StepperProps) {
  const furthest = maxNavigableStep ?? activeStep;
  const isVertical = orientation === "vertical";

  return (
    <ol
      className={cn(
        isVertical ? "flex flex-col gap-1" : "flex flex-col justify-between gap-4 sm:flex-row sm:items-center",
        className,
      )}>
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = completedSteps.includes(index) || (completedSteps.length === 0 && index < activeStep);
        // The step underfoot stays highlighted as active; red is for steps left behind.
        const isInvalid = invalidSteps.includes(index) && !isActive;
        const isNavigable = index <= furthest;

        return (
          <li
            key={step.id}
            className={cn("flex items-center gap-4", isVertical ? "relative" : "flex-1 last:flex-none")}>
            {/* Connector between markers, so a vertical rail reads as one thread. */}
            {isVertical && index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-5 top-12 h-[calc(100%-1.5rem)] w-px",
                  isCompleted ? "bg-emerald-200" : "bg-slate-200",
                )}
              />
            )}
            <button
              type="button"
              onClick={() => isNavigable && onStepChange(index)}
              disabled={!isNavigable}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Step ${index + 1}: ${step.title}`}
              className={cn(
                "group flex items-center gap-4 rounded-xl text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2",
                isVertical && "w-full px-3 py-3",
                isVertical && isActive && "bg-blue-50",
                isVertical && !isActive && isNavigable && "hover:bg-slate-50",
                isNavigable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
              )}>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all duration-300",
                  isInvalid
                    ? "bg-rose-500 text-white shadow-rose-200"
                    : isActive
                      ? "bg-blue-600 text-white shadow-blue-200"
                      : isCompleted
                        ? "bg-emerald-500 text-white shadow-emerald-200"
                        : "bg-slate-100 text-slate-400 shadow-none group-hover:bg-slate-200",
                )}>
                {isInvalid ? (
                  <AlertCircle className="size-5" strokeWidth={2.5} />
                ) : isCompleted ? (
                  <Check className="size-5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </span>

              <span className="flex flex-col">
                <span
                  className={cn(
                    "text-[15px] font-semibold transition-colors",
                    isInvalid ? "text-rose-600" : isActive ? "text-slate-900" : "text-slate-600",
                  )}>
                  {step.title}
                </span>
                {step.description && (
                  <span className="mt-0.5 text-sm text-slate-500">{step.description}</span>
                )}
              </span>
            </button>

            {!isVertical && index < steps.length - 1 && (
              <span className="mx-auto hidden sm:block" aria-hidden="true">
                <ChevronRight className="size-4 text-slate-300" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper };
