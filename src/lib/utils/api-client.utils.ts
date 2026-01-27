/**
 * API Client Utilities
 *
 * Wrapper for fetch with automatic token injection and 401 handling.
 */

import { getAuthToken, clearAuthSession } from "./session.utils";

/**
 * Options for API client
 */
export interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean; // Skip adding Authorization header
}

/**
 * API Client wrapper with automatic token injection and 401 handling
 */
export async function apiClient(url: string, options: ApiClientOptions = {}): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;

  // Prepare headers
  const headers = new Headers(fetchOptions.headers);

  // Add Authorization header if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Add Content-Type if not set and body is present
  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Make request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    clearAuthSession();

    // Redirect to login with current path as redirect param
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;

    // Throw error to stop further processing
    throw new Error("Session expired");
  }

  return response;
}
