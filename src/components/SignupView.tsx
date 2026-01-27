/**
 * SignupView Component
 *
 * Registration form for new users with React Hook Form.
 *
 * Features:
 * - Email and password input
 * - Password confirmation with automatic validation
 * - Password strength indicator
 * - Form validation with real-time feedback
 * - Loading states
 * - Field-level error handling
 * - Link to login
 * - Accessibility (ARIA labels, error announcements)
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { signupFormSchema, type SignupFormData } from "@/lib/validators/auth.validator.client";
import { useSignup } from "@/hooks/useAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function SignupView() {
  // Redirect if already logged in
  useAuthRedirect();

  // Email confirmation state (separate from form state)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle redirect after successful signup
  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/dashboard";
    }
  }, [shouldRedirect]);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched", // Validate on blur
  });

  const password = watch("password");

  // Signup API hook
  const { signup, isLoading, error } = useSignup();

  // Form submit handler
  const onSubmit = async (data: SignupFormData) => {
    try {
      // Only send email and password to API (not confirmPassword)
      const result = await signup({
        email: data.email,
        password: data.password,
      });

      // Check if email confirmation is required
      if (result && "requiresEmailConfirmation" in result && result.requiresEmailConfirmation) {
        setSubmittedEmail(data.email);
        setShowEmailConfirmation(true);
        return;
      }

      // Otherwise redirect to dashboard (session already stored by useSignup)
      setShouldRedirect(true);
    } catch {
      // Error is already handled by useSignup hook
    }
  };

  // Email confirmation success state
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{submittedEmail}</span>. Please check your email and click
              the link to activate your account.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Go to Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSigningUp = isSubmitting || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>Start tracking your productivity with VibeCheck</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-input">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("email")}
                id="email-input"
                type="email"
                placeholder="your@email.com"
                disabled={isSigningUp}
                aria-required="true"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password-input">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("password")}
                id="password-input"
                type="password"
                placeholder="••••••••"
                disabled={isSigningUp}
                aria-required="true"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={password || ""} />
            </div>

            {/* Confirm Password Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password-input">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("confirmPassword")}
                id="confirm-password-input"
                type="password"
                placeholder="••••••••"
                disabled={isSigningUp}
                aria-required="true"
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" role="alert">
                {error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isSigningUp} className="w-full">
              {isSigningUp ? "Creating account..." : "Sign Up"}
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
