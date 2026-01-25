/**
 * LoginView Component
 *
 * Login form for existing users.
 *
 * Features:
 * - Email and password input
 * - Remember me checkbox
 * - Form validation
 * - Loading states
 * - Error handling
 * - Links to forgot password and signup
 * - Accessibility (ARIA labels, error announcements)
 */

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { loginSchema } from "@/lib/validators/auth.validator";
import { storeAuthSession, hasValidSession } from "@/lib/utils/session.utils";
import type { LoginResponseDTO, ErrorResponseDTO } from "@/types";

interface LoginViewProps {
  redirectTo?: string;
}

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
}

export default function LoginView({ redirectTo = "/dashboard" }: LoginViewProps) {
  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
    rememberMe: false,
    isLoading: false,
    error: null,
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

    // Client-side validation
    const validationResult = loginSchema.safeParse({
      email: formState.email,
      password: formState.password,
      rememberMe: formState.rememberMe,
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
          rememberMe: formState.rememberMe,
        }),
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data: LoginResponseDTO = await response.json();

      // Store session
      storeAuthSession(data.session, formState.rememberMe);

      // Redirect to dashboard or specified URL
      window.location.href = redirectTo;
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In to VibeCheck</CardTitle>
          <CardDescription>Enter your credentials to access your productivity dashboard</CardDescription>
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
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={formState.rememberMe}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, rememberMe: !!checked }))}
                disabled={formState.isLoading}
              />
              <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>

            {/* Error Alert */}
            {formState.error && (
              <Alert variant="destructive" role="alert">
                {formState.error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={formState.isLoading} className="w-full">
              {formState.isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <a
                href="/forgot-password"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Forgot password?
              </a>
              <span className="hidden sm:inline">·</span>
              <span>
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Create account
                </a>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
