/**
 * useAuthRedirect Hook
 *
 * Automatically redirects authenticated users to dashboard.
 * Used on public pages like login, signup to prevent logged-in users from accessing them.
 */

import { useEffect } from "react";
import { hasValidSession } from "@/lib/utils/session.utils";

/**
 * Redirects user to target path if they have a valid session
 * @param targetPath - Path to redirect to (defaults to /dashboard)
 */
export function useAuthRedirect(targetPath = "/dashboard") {
  useEffect(() => {
    if (hasValidSession()) {
      window.location.href = targetPath;
    }
  }, [targetPath]);
}
