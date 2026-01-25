/**
 * PersistentHeader Component
 *
 * Sticky header displayed at the top of the dashboard.
 *
 * Features:
 * - Sticky positioning (always visible)
 * - Logo/App name as link to dashboard
 * - UserMenu on the right
 * - Responsive layout
 * - Border separator
 */

import { Activity } from "lucide-react";
import { UserMenu } from "./UserMenu";
import type { UserDTO } from "@/types";

interface PersistentHeaderProps {
  /** Current user information */
  user: UserDTO;
  /** Callback when logout is clicked */
  onLogout: () => Promise<void>;
}

export function PersistentHeader({ user, onLogout }: PersistentHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo / App Name */}
        <a
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
        >
          <Activity className="size-6 text-primary" />
          <span>VibeCheck</span>
        </a>

        {/* User Menu */}
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
