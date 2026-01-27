/**
 * PasswordStrengthIndicator Component
 *
 * Visual indicator for password strength with requirements checklist.
 *
 * Features:
 * - Color-coded strength bar (weak, medium, strong)
 * - Requirements checklist (length, uppercase, lowercase, number)
 * - Real-time validation feedback
 * - Accessibility (ARIA labels)
 */

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "One number",
    test: (password) => /[0-9]/.test(password),
  },
];

type PasswordStrength = "weak" | "medium" | "strong";

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  // Calculate password strength
  const { strength, metRequirements } = useMemo(() => {
    if (!password) {
      return { strength: "weak" as PasswordStrength, metRequirements: 0 };
    }

    const metRequirements = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;

    let strength: PasswordStrength = "weak";
    if (metRequirements === PASSWORD_REQUIREMENTS.length) {
      strength = "strong";
    } else if (metRequirements >= 2) {
      strength = "medium";
    }

    return { strength, metRequirements };
  }, [password]);

  // Don't show indicator if password is empty
  if (!password) {
    return null;
  }

  // Strength bar colors
  const strengthColors = {
    weak: "bg-destructive",
    medium: "bg-orange-500",
    strong: "bg-green-500",
  };

  // Strength bar widths
  const strengthWidths = {
    weak: "w-1/3",
    medium: "w-2/3",
    strong: "w-full",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Strength bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium capitalize",
              strength === "weak" && "text-destructive",
              strength === "medium" && "text-orange-600",
              strength === "strong" && "text-green-600"
            )}
          >
            {strength}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", strengthColors[strength], strengthWidths[strength])}
            role="progressbar"
            aria-valuenow={metRequirements}
            aria-valuemin={0}
            aria-valuemax={PASSWORD_REQUIREMENTS.length}
            aria-label={`Password strength: ${strength}`}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="flex flex-col gap-1 text-xs" role="list">
        {PASSWORD_REQUIREMENTS.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2",
                isMet ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
              )}
            >
              {isMet ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{requirement.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
