/**
 * LoginView Component
 *
 * Login form for existing users with React Hook Form.
 *
 * Features:
 * - Email and password input
 * - Remember me checkbox
 * - Form validation with real-time feedback
 * - Loading states
 * - Field-level error handling
 * - Links to forgot password and signup
 * - Accessibility (ARIA labels, error announcements)
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { loginSchema } from "@/lib/validators/auth.validator";
import { useLogin } from "@/hooks/useAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import type { z } from "zod";

interface LoginViewProps {
  redirectTo?: string;
}

// Infer form type from schema
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginView({ redirectTo = "/dashboard" }: LoginViewProps) {
  // Redirect if already logged in
  useAuthRedirect(redirectTo);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onTouched", // Validate on blur
  });

  // Login API hook
  const { login, isLoading, error } = useLogin();
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Form submit handler
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      // Mark login as successful, redirect will happen in useEffect
      setLoginSuccess(true);
    } catch {
      // Error is already handled by useLogin hook
    }
  };

  // Handle redirect after successful login
  useEffect(() => {
    if (loginSuccess) {
      window.location.href = redirectTo;
    }
  }, [loginSuccess, redirectTo]);

  const isLoggingIn = isSubmitting || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In to VibeCheck</CardTitle>
          <CardDescription>Enter your credentials to access your productivity dashboard</CardDescription>
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
                disabled={isLoggingIn}
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
                disabled={isLoggingIn}
                aria-required="true"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={watch("rememberMe")}
                onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
                disabled={isLoggingIn}
              />
              <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" role="alert">
                {error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isLoggingIn} className="w-full">
              {isLoggingIn ? "Signing in..." : "Sign In"}
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
