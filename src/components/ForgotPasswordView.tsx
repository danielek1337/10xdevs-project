/**
 * ForgotPasswordView Component
 *
 * Password recovery form - initiates password reset flow.
 *
 * Features:
 * - Email input
 * - Form validation
 * - Loading states
 * - Success state (email sent confirmation)
 * - Error handling
 * - Link back to login
 * - Accessibility (ARIA labels, error announcements)
 */

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validators/auth.validator";
import { hasValidSession } from "@/lib/utils/session.utils";
import type { MessageResponseDTO, ErrorResponseDTO } from "@/types";

interface ForgotPasswordState {
  email: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export default function ForgotPasswordView() {
  const [state, setState] = useState<ForgotPasswordState>({
    email: "",
    isLoading: false,
    error: null,
    success: false,
  });

  // Client-side auth check - redirect to dashboard if already logged in
  useEffect(() => {
    if (hasValidSession()) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Client-side validation
    const validationResult = forgotPasswordSchema.safeParse({ email: state.email });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const errorMessage = errors.email?.[0] || "Please enter a valid email address";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email }),
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();
        throw new Error(error.error || "Failed to send reset link");
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        success: true,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }));
    }
  };

  // Success state
  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" aria-hidden="true" />
            </div>
            <CardTitle className="text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              If an account exists for <span className="font-medium text-foreground">{state.email}</span>,
              you will receive a password reset link shortly.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Back to Sign In</a>
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
          <CardTitle>Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
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
                value={state.email}
                onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
                disabled={state.isLoading}
                required
                aria-required="true"
              />
            </div>

            {/* Error Alert */}
            {state.error && (
              <Alert variant="destructive" role="alert">
                {state.error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={state.isLoading} className="w-full">
              {state.isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            {/* Link back to Login */}
            <div className="text-center text-sm text-muted-foreground">
              <a
                href="/login"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Back to sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

