/**
 * ResetPasswordView Component
 *
 * Password reset form with React Hook Form - sets new password after clicking email link.
 *
 * Features:
 * - Extract tokens from URL hash (custom hook)
 * - New password input with strength indicator
 * - Password confirmation with automatic validation
 * - Form validation with real-time feedback
 * - Loading states
 * - Success state (with auto-redirect)
 * - Error handling (invalid/expired token)
 * - Link to request new link
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
import { CheckCircle2 } from "lucide-react";
import { resetPasswordFormSchema, type ResetPasswordFormData } from "@/lib/validators/auth.validator.client";
import { useResetPassword } from "@/hooks/useAuth";
import { useResetTokens } from "@/hooks/useResetTokens";

export default function ResetPasswordView() {
  // Extract tokens from URL
  const { accessToken, error: tokenError } = useResetTokens();

  // Success state
  const [success, setSuccess] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched", // Validate on blur
  });

  const password = watch("password");

  // Reset password API hook
  const { resetPassword, isLoading, error } = useResetPassword();

  // Handle redirect after success
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  // Form submit handler
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!accessToken) {
      return;
    }

    try {
      await resetPassword(accessToken, data.password);
      setSuccess(true);
      setShouldRedirect(true);
    } catch {
      // Error is already handled by useResetPassword hook
    }
  };

  // Error state: invalid token
  if (tokenError && !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4" role="alert">
              {tokenError}
            </Alert>
            <Button asChild className="w-full">
              <a href="/forgot-password">Request new link</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" aria-hidden="true" />
            </div>
            <CardTitle className="text-center">Password Reset Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Your password has been reset successfully. Redirecting to sign in...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isResetting = isSubmitting || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password-input">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("password")}
                id="password-input"
                type="password"
                placeholder="••••••••"
                disabled={isResetting}
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
                Confirm New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("confirmPassword")}
                id="confirm-password-input"
                type="password"
                placeholder="••••••••"
                disabled={isResetting}
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
            <Button type="submit" disabled={isResetting} className="w-full">
              {isResetting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
