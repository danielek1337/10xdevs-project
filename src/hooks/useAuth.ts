/**
 * Authentication Hooks
 *
 * Custom hooks for authentication-related API calls.
 * These hooks provide a clean separation between UI and business logic.
 */

import { useState, useRef, useEffect } from "react";
import { storeAuthSession } from "@/lib/utils/session.utils";
import type { LoginDTO, SignupDTO } from "@/lib/validators/auth.validator";
import type { LoginResponseDTO, SignupResponseDTO, MessageResponseDTO, ErrorResponseDTO } from "@/types";

/**
 * Generic auth mutation hook
 * Provides consistent API call pattern with loading and error states
 */
function useAuthMutation<TData, TResponse>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TResponse) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const mutate = async (data: TData, headers?: Record<string, string>): Promise<TResponse> => {
    // Cancel previous request if still running
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(data),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error || "Request failed");
      }

      const result: TResponse = await response.json();
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        throw err;
      }

      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      options?.onError?.(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return { mutate, isLoading, error, reset };
}

/**
 * Login hook
 * Handles user authentication and session storage
 */
export function useLogin() {
  const { mutate, isLoading, error, reset } = useAuthMutation<LoginDTO, LoginResponseDTO>("/api/auth/login");

  const login = async (data: LoginDTO) => {
    const result = await mutate(data);
    // Store session after successful login
    storeAuthSession(result.session, data.rememberMe || false);
    return result;
  };

  return { login, isLoading, error, reset };
}

/**
 * Signup hook
 * Handles user registration
 */
export function useSignup() {
  const { mutate, isLoading, error, reset } = useAuthMutation<SignupDTO, SignupResponseDTO>("/api/auth/signup");

  const signup = async (data: SignupDTO) => {
    const result = await mutate(data);

    // Check if email confirmation is required
    if ((result as any).requiresEmailConfirmation) {
      return { ...result, requiresEmailConfirmation: true };
    }

    // Store session after successful signup (if no email confirmation required)
    storeAuthSession(result.session, false);
    return result;
  };

  return { signup, isLoading, error, reset };
}

/**
 * Forgot password hook
 * Sends password reset email
 */
export function useForgotPassword() {
  const { mutate, isLoading, error, reset } = useAuthMutation<{ email: string }, MessageResponseDTO>(
    "/api/auth/forgot-password"
  );

  const sendResetEmail = async (email: string) => {
    return await mutate({ email });
  };

  return { sendResetEmail, isLoading, error, reset };
}

/**
 * Reset password hook
 * Updates user password with reset token
 */
export function useResetPassword() {
  const { mutate, isLoading, error, reset } = useAuthMutation<{ password: string }, MessageResponseDTO>(
    "/api/auth/reset-password"
  );

  const resetPassword = async (accessToken: string, password: string) => {
    return await mutate(
      { password },
      {
        Authorization: `Bearer ${accessToken}`,
      }
    );
  };

  return { resetPassword, isLoading, error, reset };
}
