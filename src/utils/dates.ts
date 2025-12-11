type DateInput = string | Date | null | undefined;

/**
 * Parse a date input, treating plain YYYY-MM-DD strings as local dates (not UTC)
 * This prevents timezone-related date shifts for users in non-UTC timezones
 */
function parseDateInput(input: DateInput): Date | null {
  if (!input) return null;

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'string') {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date string to localized Spanish format
 */
export function formatDate(dateString: DateInput): string {
  const date = parseDateInput(dateString);
  if (!date) return 'N/A';
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date to short format (day and month only)
 */
export function formatDateShort(dateString: DateInput): string {
  const date = parseDateInput(dateString);
  if (!date) return 'N/A';
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format a date to long format
 */
export function formatDateLong(dateString: DateInput): string {
  const date = parseDateInput(dateString);
  if (!date) return 'N/A';
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: string | Date, endDate: string | Date = new Date()): number {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (!start || !end) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate weeks from days
 */
export function daysToWeeks(days: number): number {
  return Math.ceil(days / 7);
}

/**
 * Get current week number from start date
 */
export function getCurrentWeek(startDate: string | Date): number {
  const start = parseDateInput(startDate);
  if (!start) return 1;
  const days = daysBetween(start);
  return Math.min(daysToWeeks(days), 6);
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string | Date): boolean {
  const date = parseDateInput(dateString);
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string | Date): string {
  const date = parseDateInput(dateString);
  if (!date) return 'N/A';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
}