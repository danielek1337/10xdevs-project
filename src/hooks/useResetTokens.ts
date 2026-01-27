/**
 * useResetTokens Hook
 *
 * Parses and validates password reset tokens from URL hash.
 * Used in the password reset flow after user clicks email link.
 */

import { useState, useEffect } from "react";

interface ResetTokens {
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

/**
 * Extracts reset tokens from URL hash
 * Returns tokens if valid, or error message if invalid/missing
 */
export function useResetTokens(): ResetTokens {
  const [tokens, setTokens] = useState<ResetTokens>({
    accessToken: null,
    refreshToken: null,
    error: null,
  });

  useEffect(() => {
    // Parse URL hash (format: #access_token=xxx&refresh_token=yyy)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // Validate access token exists
    if (!accessToken) {
      setTokens({
        accessToken: null,
        refreshToken: null,
        error: "Invalid or expired reset link",
      });
      return;
    }

    // Set valid tokens
    setTokens({
      accessToken,
      refreshToken,
      error: null,
    });
  }, []);

  return tokens;
}
