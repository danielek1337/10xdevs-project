/**
 * ResetPasswordView Component
 *
 * Password reset form - sets new password after clicking email link.
 *
 * Features:
 * - Extract tokens from URL hash
 * - New password input with strength indicator
 * - Password confirmation
 * - Form validation
 * - Loading states
 * - Success state (with auto-redirect)
 * - Error handling (invalid/expired token)
 * - Link to request new link
 * - Accessibility (ARIA labels, error announcements)
 */

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { CheckCircle2 } from "lucide-react";

interface ResetPasswordState {
  accessToken: string | null;
  refreshToken: string | null;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export default function ResetPasswordView() {
  const [state, setState] = useState<ResetPasswordState>({
    accessToken: null,
    refreshToken: null,
    password: "",
    confirmPassword: "",
    isLoading: false,
    error: null,
    success: false,
  });

  // Extract tokens from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken) {
      setState((prev) => ({
        ...prev,
        error: "Invalid or expired reset link",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      accessToken,
      refreshToken,
    }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!state.accessToken) {
      setState((prev) => ({
        ...prev,
        error: "Invalid reset link",
      }));
      return;
    }

    if (state.password !== state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        error: "Passwords do not match",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // TODO: Implement API call to /api/auth/reset-password
    // For now, just simulate loading
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        success: true,
      }));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }, 1000);
  };

  // Error state: invalid token
  if (state.error && !state.accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4" role="alert">
              {state.error}
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
  if (state.success) {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password-input">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password-input"
                name="password"
                type="password"
                placeholder="••••••••"
                value={state.password}
                onChange={(e) => setState((prev) => ({ ...prev, password: e.target.value }))}
                disabled={state.isLoading}
                required
                aria-required="true"
              />
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={state.password} />
            </div>

            {/* Confirm Password Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password-input">
                Confirm New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirm-password-input"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={state.confirmPassword}
                onChange={(e) => setState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={state.isLoading}
                required
                aria-required="true"
                aria-invalid={
                  state.confirmPassword && state.password !== state.confirmPassword
                }
              />
              {state.confirmPassword && state.password !== state.confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {/* Error Alert */}
            {state.error && (
              <Alert variant="destructive" role="alert">
                {state.error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={state.isLoading} className="w-full">
              {state.isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

