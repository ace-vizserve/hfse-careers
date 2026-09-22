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
      data-step-rail
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
                  isCompleted ? "bg-[#A9E4CC]" : "bg-[#E1E5F0]",
                )}
              />
            )}
            <button
              type="button"
              onClick={() => isNavigable && onStepChange(index)}
              disabled={!isNavigable}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Step ${index + 1}: ${step.title}`}
              // The marker's state is carried entirely in colour and an icon,
              // which nothing outside a screenshot can assert on.
              data-step-state={isInvalid ? "invalid" : isActive ? "active" : isCompleted ? "complete" : "upcoming"}
              className={cn(
                "group flex items-center gap-[14px] rounded-[10px] text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E2FA8]/40 focus-visible:ring-offset-2",
                isVertical && "w-full px-3 py-3",
                isVertical && isActive && "bg-[#E7EAFB]",
                isVertical && !isActive && isNavigable && "hover:bg-[#F5F6FA]",
                isNavigable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
              )}>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold transition-all duration-300",
                  isInvalid
                    ? "bg-[#C2410C] text-white shadow-[0_2px_6px_rgba(194,65,12,0.3)]"
                    : isActive
                      ? "bg-[#1E2FA8] text-white shadow-[0_2px_6px_rgba(30,47,168,0.32)]"
                      : isCompleted
                        ? "bg-[#10A56B] text-white shadow-[0_2px_6px_rgba(16,165,107,0.3)]"
                        : "bg-[#EDEFF6] text-[#8A92AB] group-hover:bg-[#E3E6F0]",
                )}>
                {isInvalid ? (
                  <AlertCircle className="size-5" strokeWidth={2.5} />
                ) : isCompleted ? (
                  <Check className="size-[18px]" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </span>

              <span className="flex flex-col">
                <span
                  className={cn(
                    "text-[15px] font-semibold transition-colors",
                    isInvalid ? "text-[#C2410C]" : isActive ? "text-[#10162B]" : "text-[#5B6480]",
                  )}>
                  {step.title}
                </span>
                {step.description && (
                  <span className={cn("mt-px text-[13px]", isActive ? "text-[#6C7591]" : "text-[#8A92AB]")}>
                    {step.description}
                  </span>
                )}
              </span>
            </button>

            {!isVertical && index < steps.length - 1 && (
              <span className="mx-auto hidden sm:block" aria-hidden="true">
                <ChevronRight className="size-4 text-[#C3C9DC]" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper };
