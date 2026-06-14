import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ProgressStep {
  label: string;
}

interface ProgressBarProps {
  steps: ProgressStep[];
  currentStep: number;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <ol className="flex items-start justify-between gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <li key={step.label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                aria-hidden
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  index === 0
                    ? "invisible"
                    : isCompleted || isActive
                      ? "bg-primary"
                      : "bg-border",
                )}
              />
              <div
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary bg-background"
                      : "border-border text-muted-foreground bg-background",
                )}
              >
                {isCompleted ? <Check className="size-4" /> : stepNumber}
              </div>
              <div
                aria-hidden
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  index === steps.length - 1
                    ? "invisible"
                    : isCompleted
                      ? "bg-primary"
                      : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-2 text-center text-xs font-medium",
                isActive || isCompleted
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
