/**
 * Session Storage Utilities
 *
 * Client-side utilities for managing authentication session
 * in localStorage/sessionStorage.
 */

import type { AuthSessionDTO } from "@/types";

const SESSION_KEY = "vibecheck_session";

/**
 * Store authentication session
 * @param session - Supabase session object
 * @param persistent - If true, store in localStorage; if false, store in sessionStorage
 */
export function storeAuthSession(session: AuthSessionDTO, persistent = false): void {
  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Retrieve authentication session
 * @returns Session object or null if not found
 */
export function getAuthSession(): AuthSessionDTO | null {
  // Check localStorage first (persistent session)
  const persistentSession = localStorage.getItem(SESSION_KEY);
  if (persistentSession) {
    try {
      return JSON.parse(persistentSession);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  // Check sessionStorage (non-persistent session)
  const sessionSession = sessionStorage.getItem(SESSION_KEY);
  if (sessionSession) {
    try {
      return JSON.parse(sessionSession);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  return null;
}

/**
 * Get access token from stored session
 * @returns Access token or null
 */
export function getAuthToken(): string | null {
  const session = getAuthSession();
  return session?.access_token || null;
}

/**
 * Clear authentication session from both storages
 */
export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Check if session is expired
 * @param session - Session to check
 * @returns true if expired, false otherwise
 */
export function isSessionExpired(session: AuthSessionDTO): boolean {
  const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
  return now >= session.expires_at;
}

/**
 * Check if current session is valid
 * @returns true if valid and not expired, false otherwise
 */
export function hasValidSession(): boolean {
  const session = getAuthSession();
  if (!session) return false;
  return !isSessionExpired(session);
}
