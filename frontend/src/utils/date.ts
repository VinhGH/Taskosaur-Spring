import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const TZ_CACHE_KEY = 'user_timezone';
const TZ_VERSION_KEY = 'user_timezone_version';

// --- Timezone Resolution ---

/**
 * Detects the browser's timezone
 * @returns The browser's IANA timezone identifier (e.g., 'America/New_York')
 */
export const detectBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * Gets the user's preferred timezone
 * Priority: 1. Cached timezone (non-UTC) → 2. Browser timezone
 * @returns The user's IANA timezone identifier
 */
export const getUserTimezone = (): string => {
  if (typeof window === 'undefined') return 'UTC';

  // Try cached timezone with version check
  try {
    const cached = localStorage.getItem(TZ_CACHE_KEY);
    if (cached && cached !== 'UTC') return cached;
  } catch {
    // Ignore localStorage errors
  }

  // Fallback to browser timezone
  return detectBrowserTimezone();
};

/**
 * Caches the user's timezone preference in localStorage
 * @param tz - The timezone to cache
 * @param version - Optional version timestamp (from user.updatedAt) for cache invalidation
 */
export const setUserTimezoneCache = (tz: string, version?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TZ_CACHE_KEY, tz);
    if (version) localStorage.setItem(TZ_VERSION_KEY, version);
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Invalidates the cached timezone preference
 * Forces re-detection on next getUserTimezone() call
 */
export const invalidateTimezoneCache = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TZ_CACHE_KEY);
    localStorage.removeItem(TZ_VERSION_KEY);
  } catch {
    // Ignore localStorage errors
  }
};

// --- Date Formatting ---

/**
 * Formats a date string for display in the user's timezone
 * @param dateString - ISO date string or valid date string
 * @param format - Day.js format string (default: 'MMM D, YYYY')
 * @returns Formatted date string or empty string if input is invalid
 */
export const formatDateForDisplay = (
  dateString: string,
  format: string = 'MMM D, YYYY'
): string => {
  if (!dateString) return '';
  const d = dayjs(dateString);
  if (!d.isValid()) return '';
  return d.tz(getUserTimezone()).format(format);
};

/**
 * Gets a relative date label (Today, Tomorrow, Yesterday, etc.) in user's timezone
 * @param dateString - ISO date string or valid date string
 * @returns Relative date label or formatted date string
 */
export const getRelativeDateLabel = (dateString: string): string => {
  if (!dateString) return '';

  const date = dayjs(dateString).tz(getUserTimezone()).startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date.isValid()) return '';

  const diffDays = date.diff(now, 'day');

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

  return date.format('MMM D, YYYY');
};

/**
 * Formats a date with time for display in user's timezone
 * @param dateString - ISO date string or valid date string
 * @param format - Day.js format string (default: 'MMM D, YYYY h:mm A')
 * @returns Formatted date-time string or empty string if input is invalid
 */
export const formatDateTimeForDisplay = (
  dateString: string,
  format: string = 'MMM D, YYYY h:mm A'
): string => {
  if (!dateString) return '';
  const d = dayjs(dateString);
  if (!d.isValid()) return '';
  return d.tz(getUserTimezone()).format(format);
};

// --- Date Comparisons ---

/**
 * Checks if a date is overdue (before today in user's timezone)
 * @param dateString - The due date to check
 * @param completedAt - Optional completion date (if provided and valid, returns false)
 * @returns true if the date is before today and task is not completed
 */
export const isDateOverdue = (dateString: string, completedAt?: string): boolean => {
  if (!dateString) return false;
  if (completedAt) {
    const completed = dayjs(completedAt);
    if (completed.isValid()) return false; // Task is completed
  }

  const date = dayjs(dateString).tz(getUserTimezone()).startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date.isValid()) return false;

  return date.isBefore(now);
};

/**
 * Checks if a date is today in the user's timezone
 * @param dateString - The date to check
 * @returns true if the date matches today
 */
export const isDateToday = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = dayjs(dateString).tz(getUserTimezone()).startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date.isValid()) return false;

  return date.isSame(now, 'day');
};

/**
 * Checks if a date is tomorrow in the user's timezone
 * @param dateString - The date to check
 * @returns true if the date matches tomorrow
 */
export const isDateTomorrow = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = dayjs(dateString).tz(getUserTimezone()).startOf('day');
  const tomorrow = dayjs().tz(getUserTimezone()).startOf('day').add(1, 'day');

  if (!date.isValid()) return false;

  return date.isSame(tomorrow, 'day');
};

/**
 * Checks if a date is yesterday in the user's timezone
 * @param dateString - The date to check
 * @returns true if the date matches yesterday
 */
export const isDateYesterday = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = dayjs(dateString).tz(getUserTimezone()).startOf('day');
  const yesterday = dayjs().tz(getUserTimezone()).startOf('day').subtract(1, 'day');

  if (!date.isValid()) return false;

  return date.isSame(yesterday, 'day');
};

/**
 * Calculates days until a future date (negative for past dates)
 * @param dateString - The target date
 * @returns Number of days from today (positive = future, negative = past)
 */
export const daysUntil = (dateString: string): number => {
  if (!dateString) return 0;

  const date = dayjs(dateString).tz(getUserTimezone()).startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date.isValid()) return 0;

  return date.diff(now, 'day');
};

/**
 * Calculates days ago from a past date
 * @param dateString - The past date
 * @returns Number of days since that date (always positive)
 */
export const daysAgo = (dateString: string): number => {
  if (!dateString) return 0;

  const date = dayjs(dateString).tz(getUserTimezone()).startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date.isValid()) return 0;

  return now.diff(date, 'day');
};

// --- API Formatting ---

/**
 * Formats a date string (YYYY-MM-DD) for API submission (UTC ISO string)
 * Prevents timezone shifts by creating the date at UTC midnight
 * @param dateValue - Date string in YYYY-MM-DD format
 * @returns ISO string or null if input is empty
 */
export const formatDateForApi = (dateValue: string): string | null => {
  if (!dateValue) return null;

  const [year, month, day] = dateValue.split('-');
  const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));

  if (isNaN(date.getTime())) return null;

  return date.toISOString();
};

/**
 * Gets today's date in YYYY-MM-DD format using the user's timezone
 * @returns Today's date string
 */
export const getTodayDate = (): string => {
  return dayjs().tz(getUserTimezone()).format('YYYY-MM-DD');
};
