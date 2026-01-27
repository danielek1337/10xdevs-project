/**
 * Tests for useResetTokens hook
 *
 * Tests URL hash parsing for password reset tokens
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useResetTokens } from "../useResetTokens";

describe("useResetTokens", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location using Object.defineProperty
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, hash: "" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original location using Object.defineProperty
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("should extract valid tokens from URL hash", () => {
    window.location.hash = "#access_token=mock-access-token&refresh_token=mock-refresh-token";

    const { result } = renderHook(() => useResetTokens());

    expect(result.current.accessToken).toBe("mock-access-token");
    expect(result.current.refreshToken).toBe("mock-refresh-token");
    expect(result.current.error).toBeNull();
  });

  it("should handle missing access token", () => {
    window.location.hash = "";

    const { result } = renderHook(() => useResetTokens());

    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.error).toBe("Invalid or expired reset link");
  });

  it("should handle access token without refresh token", () => {
    window.location.hash = "#access_token=mock-access-token";

    const { result } = renderHook(() => useResetTokens());

    expect(result.current.accessToken).toBe("mock-access-token");
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should handle malformed URL hash", () => {
    window.location.hash = "#invalid-hash-format";

    const { result } = renderHook(() => useResetTokens());

    expect(result.current.accessToken).toBeNull();
    expect(result.current.error).toBe("Invalid or expired reset link");
  });
});
