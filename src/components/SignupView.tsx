/**
 * SignupView Component
 *
 * Registration form for new users.
 *
 * Features:
 * - Email and password input
 * - Password confirmation
 * - Password strength indicator
 * - Form validation
 * - Loading states
 * - Error handling
 * - Link to login
 * - Accessibility (ARIA labels, error announcements)
 */

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { signupSchema } from "@/lib/validators/auth.validator";
import { storeAuthSession, hasValidSession } from "@/lib/utils/session.utils";
import type { SignupResponseDTO, ErrorResponseDTO } from "@/types";

interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  requiresEmailConfirmation: boolean;
}

export default function SignupView() {
  const [formState, setFormState] = useState<SignupFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    isLoading: false,
    error: null,
    requiresEmailConfirmation: false,
  });

  // Client-side auth check - redirect to dashboard if already logged in
  useEffect(() => {
    if (hasValidSession()) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Client-side validation - passwords match
    if (formState.password !== formState.confirmPassword) {
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Passwords do not match",
      }));
      return;
    }

    // Client-side validation with Zod
    const validationResult = signupSchema.safeParse({
      email: formState.email,
      password: formState.password,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.values(errors).flat()[0] || "Validation failed";
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();
        throw new Error(error.error || "Signup failed");
      }

      const data: SignupResponseDTO = await response.json();

      // Check if email confirmation is required
      if ((data as any).requiresEmailConfirmation) {
        setFormState((prev) => ({
          ...prev,
          isLoading: false,
          requiresEmailConfirmation: true,
        }));
        return;
      }

      // Store session and redirect to dashboard
      storeAuthSession(data.session, false);
      window.location.href = "/dashboard";
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }));
    }
  };

  // Email confirmation success state
  if (formState.requiresEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              We&apos;ve sent a confirmation link to <span className="font-medium text-foreground">{formState.email}</span>.
              Please check your email and click the link to activate your account.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Go to Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>Start tracking your productivity with VibeCheck</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-input">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email-input"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formState.email}
                onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                disabled={formState.isLoading}
                required
                aria-required="true"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password-input">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password-input"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formState.password}
                onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                disabled={formState.isLoading}
                required
                aria-required="true"
              />
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={formState.password} />
            </div>

            {/* Confirm Password Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password-input">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirm-password-input"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formState.confirmPassword}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                disabled={formState.isLoading}
                required
                aria-required="true"
                aria-invalid={
                  formState.confirmPassword && formState.password !== formState.confirmPassword
                }
              />
              {formState.confirmPassword && formState.password !== formState.confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {/* Error Alert */}
            {formState.error && (
              <Alert variant="destructive" role="alert">
                {formState.error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={formState.isLoading} className="w-full">
              {formState.isLoading ? "Creating account..." : "Sign Up"}
            </Button>

            {/* Link to Login */}
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

