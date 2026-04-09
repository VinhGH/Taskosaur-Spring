import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  detectBrowserTimezone,
  getUserTimezone,
  setUserTimezoneCache,
} from '@/utils/date';

interface UseTimezoneReturn {
  timezone: string;
  isAutoDetected: boolean;
  handleTimezoneChange: (newTz: string, autoDetect?: boolean) => Promise<void>;
  detectFromBrowser: () => void;
  isBrowserTimezoneDifferent: () => boolean;
}

/**
 * React hook for managing user timezone preferences
 *
 * Features:
 * - Syncs timezone to backend when changed
 * - Caches timezone in localStorage for fast access
 * - Detects when browser timezone differs from preference
 *
 * Note: Auto-detection on login is handled by TimezoneInitializer component.
 *
 * @returns Timezone management functions and state
 */
export const useTimezone = (): UseTimezoneReturn => {
  const { user, updateUser } = useAuth();
  const [timezone, setTimezone] = useState<string>(getUserTimezone());
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  // Update local timezone when user profile changes
  useEffect(() => {
    if (user?.timezone && user.timezone !== 'UTC') {
      setTimezone(user.timezone);
      setUserTimezoneCache(user.timezone, user.updatedAt);
    }
  }, [user?.timezone, user?.updatedAt]);

  /**
   * Updates the user's timezone preference
   * @param newTz - The new timezone to set
   * @param autoDetect - Whether this was auto-detected (for UI feedback)
   */
  const handleTimezoneChange = useCallback(async (
    newTz: string,
    autoDetect: boolean = false
  ): Promise<void> => {
    setTimezone(newTz);
    setUserTimezoneCache(newTz);
    setIsAutoDetected(autoDetect);

    if (user) {
      try {
        await updateUser(user.id, { timezone: newTz });
      } catch (error) {
        console.error('Failed to update timezone:', error);
        // Revert to previous value on failure
        setTimezone(getUserTimezone());
      }
    }
  }, [user, updateUser]);

  /**
   * Detects timezone from browser and updates preference
   */
  const detectFromBrowser = useCallback(() => {
    const browserTz = detectBrowserTimezone();
    handleTimezoneChange(browserTz, true).catch(() => {
      setTimezone(browserTz);
      setUserTimezoneCache(browserTz);
    });
  }, [handleTimezoneChange]);

  /**
   * Checks if browser timezone differs from current preference
   * @returns true if browser TZ is different from stored preference
   */
  const isBrowserTimezoneDifferent = useCallback((): boolean => {
    const browserTz = detectBrowserTimezone();
    return browserTz !== timezone;
  }, [timezone]);

  return {
    timezone,
    isAutoDetected,
    handleTimezoneChange,
    detectFromBrowser,
    isBrowserTimezoneDifferent,
  };
};
