/**
 * Tests for useAuth hooks
 *
 * Tests authentication API hooks with MSW for API mocking
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-setup";
import { useLogin, useSignup, useForgotPassword, useResetPassword } from "../useAuth";

describe("useLogin", () => {
  it("should successfully login user", async () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.login({
        email: "test@example.com",
        password: "Password123",
        rememberMe: false,
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle login errors", async () => {
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      try {
        await result.current.login({
          email: "test@example.com",
          password: "wrong",
          rememberMe: false,
        });
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe("Invalid credentials");
    expect(result.current.isLoading).toBe(false);
  });

  it("should reset error state", async () => {
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      try {
        await result.current.login({
          email: "test@example.com",
          password: "wrong",
          rememberMe: false,
        });
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe("Invalid credentials");

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });
});

describe("useSignup", () => {
  it("should successfully signup user", async () => {
    const { result } = renderHook(() => useSignup());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.signup({
        email: "newuser@example.com",
        password: "Password123",
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle signup errors", async () => {
    server.use(
      http.post("/api/auth/signup", () => {
        return HttpResponse.json({ error: "Email already exists" }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useSignup());

    await act(async () => {
      try {
        await result.current.signup({
          email: "existing@example.com",
          password: "Password123",
        });
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe("Email already exists");
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useForgotPassword", () => {
  it("should successfully send reset email", async () => {
    const { result } = renderHook(() => useForgotPassword());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.sendResetEmail("test@example.com");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle forgot password errors", async () => {
    server.use(
      http.post("/api/auth/forgot-password", () => {
        return HttpResponse.json({ error: "Service unavailable" }, { status: 503 });
      })
    );

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      try {
        await result.current.sendResetEmail("test@example.com");
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe("Service unavailable");
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useResetPassword", () => {
  it("should successfully reset password", async () => {
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.resetPassword("mock-access-token", "NewPassword123");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle reset password errors", async () => {
    server.use(
      http.post("/api/auth/reset-password", () => {
        return HttpResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      try {
        await result.current.resetPassword("invalid-token", "NewPassword123");
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe("Invalid or expired token");
    expect(result.current.isLoading).toBe(false);
  });
});
