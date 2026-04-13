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
 * Maps Intl.DateTimeFormat options to dayjs format tokens
 */
function intlOptionsToDayjsFormat(options: Intl.DateTimeFormatOptions): string {
  const parts: string[] = [];

  if (options.weekday) {
    parts.push(options.weekday === 'long' ? 'dddd' : options.weekday === 'short' ? 'ddd' : 'dd');
  }
  if (options.month) {
    parts.push(options.month === 'long' ? 'MMMM' : options.month === 'short' ? 'MMM' : 'MM');
  }
  if (options.day) {
    parts.push(options.day === '2-digit' ? 'DD' : 'D');
  }
  if (options.year) {
    parts.push(options.year === 'numeric' ? 'YYYY' : 'YY');
  }
  if (options.hour) {
    parts.push(options.hour === '2-digit' ? 'hh' : 'h');
  }
  if (options.minute) {
    parts.push(options.minute === '2-digit' ? 'mm' : 'm');
  }
  if (options.second) {
    parts.push(options.second === '2-digit' ? 'ss' : 's');
  }
  if (options.hour12 === false && options.hour) {
    return parts.join(' ').replace(/h/g, 'H');
  }

  return parts.join(' ');
}

/**
 * Detects whether a string is a date-only value (YYYY-MM-DD or similar)
 * vs. a full datetime with time components.
 * Date-only values should NOT be timezone-shifted — they represent floating dates.
 */
function isDateOnly(value: string): boolean {
  // Pure date-only: exactly YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  // ISO date: YYYY-MM-DDTHH:mm:ss.sssZ but with midnight time → still a floating date
  // We treat it as date-only if time is exactly 00:00:00.000Z
  if (/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(value)) return true;
  return false;
}

/**
 * Resolves a date input into a dayjs instance in the user's timezone.
 * For date-only values (no time component), preserves the calendar date.
 * For datetime values, properly converts to the user's timezone.
 */
function resolveDateInput(
  dateInput: string | Date,
  mode: 'date' | 'datetime'
): dayjs.Dayjs | null {
  if (!dateInput) return null;

  if (typeof dateInput === 'string' && isDateOnly(dateInput)) {
    // Date-only: extract the YYYY-MM-DD part and parse it as a floating date
    const datePart = dateInput.substring(0, 10); // YYYY-MM-DD
    const d = dayjs(datePart);
    if (!d.isValid()) return null;
    return d;
  }

  // Datetime: parse and convert to user's timezone
  const d = dayjs(dateInput);
  if (!d.isValid()) return null;

  if (mode === 'date') {
    // For date-only display, we still want the calendar date, not shifted
    // But if it's a full datetime, convert to user's timezone first
    return d.tz(getUserTimezone());
  }

  return d.tz(getUserTimezone());
}

type FormatInput = string | Intl.DateTimeFormatOptions;

/**
 * Formats a date string for display in the user's timezone.
 * 
 * IMPORTANT: For date-only values (e.g. "2026-03-15" or "2026-03-15T00:00:00.000Z"),
 * the calendar date is preserved WITHOUT timezone shifting. This ensures that
 * "March 15" always shows as "March 15" regardless of the user's timezone.
 * 
 * For datetime values (with actual time components), proper timezone conversion is applied.
 * 
 * @param dateInput - Date string or Date object
 * @param format - Day.js format string or Intl options (default: 'MMM D, YYYY')
 * @returns Formatted date string or empty string if input is invalid
 */
export const formatDateForDisplay = (
  dateInput: string | Date,
  format: FormatInput = 'MMM D, YYYY'
): string => {
  if (!dateInput) return '';
  const fmt = typeof format === 'string' ? format : intlOptionsToDayjsFormat(format);
  const d = resolveDateInput(dateInput, 'date');
  if (!d) return '';
  return d.format(fmt);
};

/**
 * Gets a relative date label (Today, Tomorrow, Yesterday, etc.) in user's timezone.
 * For date-only values, preserves the calendar date.
 */
export const getRelativeDateLabel = (dateString: string): string => {
  if (!dateString) return '';

  const date = resolveDateInput(dateString, 'date')?.startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date || !date.isValid()) return '';

  const diffDays = date.diff(now, 'day');

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

  return date.format('MMM D, YYYY');
};

/**
 * Formats a date with time for display in user's timezone.
 * For date-only values, shows the calendar date at midnight (no time shift).
 * For datetime values, properly converts to the user's timezone.
 */
export const formatDateTimeForDisplay = (
  dateInput: string | Date,
  format: FormatInput = 'MMM D, YYYY h:mm A'
): string => {
  if (!dateInput) return '';
  const fmt = typeof format === 'string' ? format : intlOptionsToDayjsFormat(format);
  const d = resolveDateInput(dateInput, 'datetime');
  if (!d) return '';
  return d.format(fmt);
};

// --- Date Comparisons ---

/**
 * Checks if a date is overdue (before today in user's timezone).
 * For date-only values, preserves the calendar date.
 */
export const isDateOverdue = (dateString: string, completedAt?: string): boolean => {
  if (!dateString) return false;
  if (completedAt) {
    const completed = dayjs(completedAt);
    if (completed.isValid()) return false; // Task is completed
  }

  const date = resolveDateInput(dateString, 'date')?.startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date || !date.isValid()) return false;

  return date.isBefore(now);
};

/**
 * Checks if a date is today in the user's timezone.
 * For date-only values, preserves the calendar date.
 */
export const isDateToday = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = resolveDateInput(dateString, 'date')?.startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date || !date.isValid()) return false;

  return date.isSame(now, 'day');
};

/**
 * Checks if a date is tomorrow in the user's timezone.
 * For date-only values, preserves the calendar date.
 */
export const isDateTomorrow = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = resolveDateInput(dateString, 'date')?.startOf('day');
  const tomorrow = dayjs().tz(getUserTimezone()).startOf('day').add(1, 'day');

  if (!date || !date.isValid()) return false;

  return date.isSame(tomorrow, 'day');
};

/**
 * Checks if a date is yesterday in the user's timezone.
 * For date-only values, preserves the calendar date.
 */
export const isDateYesterday = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = resolveDateInput(dateString, 'date')?.startOf('day');
  const yesterday = dayjs().tz(getUserTimezone()).startOf('day').subtract(1, 'day');

  if (!date || !date.isValid()) return false;

  return date.isSame(yesterday, 'day');
};

/**
 * Calculates days until a future date (negative for past dates).
 * For date-only values, preserves the calendar date.
 */
export const daysUntil = (dateString: string): number => {
  if (!dateString) return 0;

  const date = resolveDateInput(dateString, 'date')?.startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date || !date.isValid()) return 0;

  return date.diff(now, 'day');
};

/**
 * Calculates days ago from a past date.
 * For date-only values, preserves the calendar date.
 */
export const daysAgo = (dateString: string): number => {
  if (!dateString) return 0;

  const date = resolveDateInput(dateString, 'date')?.startOf('day');
  const now = dayjs().tz(getUserTimezone()).startOf('day');

  if (!date || !date.isValid()) return 0;

  return now.diff(date, 'day');
};

// --- API Formatting ---

/**
 * Formats a date string (YYYY-MM-DD) for API submission (UTC ISO string).
 * Prevents timezone shifts by creating the date at UTC midnight.
 * This ensures that "2026-03-15" always becomes "2026-03-15T00:00:00.000Z"
 * regardless of the user's timezone.
 */
export const formatDateForApi = (dateValue: string): string | null => {
  if (!dateValue) return null;

  const [year, month, day] = dateValue.split('-');
  const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));

  if (isNaN(date.getTime())) return null;

  return date.toISOString();
};

/**
 * Formats a Date object to API-ready format using user's timezone.
 * Use this when you have a Date object (e.g., from a calendar picker)
 * and need to send it to the API without timezone shifts.
 */
export const formatApiDate = (date: Date): string => {
  const tz = getUserTimezone();
  return dayjs(date).tz(tz).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
};

/**
 * Gets today's date in YYYY-MM-DD format using the user's timezone
 * @returns Today's date string
 */
export const getTodayDate = (): string => {
  return dayjs().tz(getUserTimezone()).format('YYYY-MM-DD');
};
