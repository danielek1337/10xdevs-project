/**
 * ForgotPasswordView Component
 *
 * Password recovery form with React Hook Form - initiates password reset flow.
 *
 * Features:
 * - Email input
 * - Form validation with real-time feedback
 * - Loading states
 * - Success state (email sent confirmation)
 * - Error handling
 * - Link back to login
 * - Accessibility (ARIA labels, error announcements)
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validators/auth.validator";
import { useForgotPassword } from "@/hooks/useAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import type { z } from "zod";

// Infer form type from schema
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordView() {
  // Redirect if already logged in
  useAuthRedirect();

  // Success state
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onTouched", // Validate on blur
  });

  // Forgot password API hook
  const { sendResetEmail, isLoading, error } = useForgotPassword();

  // Form submit handler
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await sendResetEmail(data.email);
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch {
      // Error is already handled by useForgotPassword hook
    }
  };

  // Success state
  if (success) {
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
              If an account exists for <span className="font-medium text-foreground">{submittedEmail}</span>, you will
              receive a password reset link shortly.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Back to Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSending = isSubmitting || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password?</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
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
                disabled={isSending}
                aria-required="true"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.email.message}
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
            <Button type="submit" disabled={isSending} className="w-full">
              {isSending ? "Sending..." : "Send Reset Link"}
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
