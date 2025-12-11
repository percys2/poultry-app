import {
  formatDate,
  formatDateShort,
  formatDateLong,
  toISODateString,
  daysBetween,
  daysToWeeks,
  getCurrentWeek,
  isToday,
  getRelativeTime,
} from '../dates';

describe('dates utilities', () => {
  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const result = formatDate('2025-01-15');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('handles null and undefined', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('handles invalid date strings', () => {
      expect(formatDate('invalid')).toBe('N/A');
    });
  });

  describe('formatDateShort', () => {
    it('formats date to short format', () => {
      const result = formatDateShort('2025-01-15');
      expect(result).toContain('15');
    });

    it('handles null and undefined', () => {
      expect(formatDateShort(null)).toBe('N/A');
      expect(formatDateShort(undefined)).toBe('N/A');
    });
  });

  describe('formatDateLong', () => {
    it('formats date to long format', () => {
      const result = formatDateLong('2025-01-15');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('handles null and undefined', () => {
      expect(formatDateLong(null)).toBe('N/A');
      expect(formatDateLong(undefined)).toBe('N/A');
    });
  });

  describe('toISODateString', () => {
    it('converts date to ISO string', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      expect(toISODateString(date)).toBe('2025-01-15');
    });
  });

  describe('daysBetween', () => {
    it('calculates days between two dates', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-11');
      expect(daysBetween(start, end)).toBe(10);
    });

    it('handles string dates', () => {
      expect(daysBetween('2025-01-01', '2025-01-11')).toBe(10);
    });

    it('handles invalid dates', () => {
      expect(daysBetween('invalid', '2025-01-11')).toBe(0);
    });
  });

  describe('daysToWeeks', () => {
    it('converts days to weeks', () => {
      expect(daysToWeeks(7)).toBe(1);
      expect(daysToWeeks(14)).toBe(2);
      expect(daysToWeeks(8)).toBe(2);
    });
  });

  describe('getCurrentWeek', () => {
    it('calculates current week from start date', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      expect(getCurrentWeek(sevenDaysAgo)).toBe(1);
    });

    it('caps at week 6', () => {
      const longAgo = new Date();
      longAgo.setDate(longAgo.getDate() - 100);
      expect(getCurrentWeek(longAgo)).toBe(6);
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('returns false for other dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('getRelativeTime', () => {
    it('returns "Hoy" for today', () => {
      expect(getRelativeTime(new Date())).toBe('Hoy');
    });

    it('returns "Ayer" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getRelativeTime(yesterday)).toBe('Ayer');
    });

    it('returns days ago for recent dates', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(getRelativeTime(threeDaysAgo)).toBe('Hace 3 días');
    });
  });
});
