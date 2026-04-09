import { useEffect, useRef } from 'react';
import { useTimezone } from '@/hooks/useTimezone';
import { useAuth } from '@/contexts/auth-context';

/**
 * Automatically detects and syncs user's timezone on app load / login.
 * 
 * Behavior:
 * - On initial login: If user has default "UTC" timezone, auto-detects browser TZ and updates DB
 * - On page refresh: Skips auto-detection if user already has a non-UTC timezone set
 * - On session timeout + re-login: Resets and re-runs detection (handles case where user traveled)
 * - On logout: Resets state so next login triggers detection again
 */
export const TimezoneInitializer: React.FC = () => {
  const { user } = useAuth();
  const { handleTimezoneChange } = useTimezone();
  const hasInitializedForUser = useRef<string | null>(null);

  useEffect(() => {
    // Reset if user changes (logout/login cycle)
    if (!user) {
      hasInitializedForUser.current = null;
      return;
    }

    // Skip if we already initialized for this specific user session
    if (hasInitializedForUser.current === user.id) return;

    // If user has default UTC timezone, auto-detect and update
    if (user.timezone === 'UTC' || !user.timezone) {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTz && browserTz !== 'UTC') {
        handleTimezoneChange(browserTz, true).catch(() => {
          // Silently fail - user can manually set later from profile page
        });
      }
    }

    hasInitializedForUser.current = user.id;
  }, [user?.id, user?.timezone, handleTimezoneChange]);

  return null; // This component renders nothing
};
