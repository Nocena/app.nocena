// lib/utils/dateUtils.ts

/**
 * Get the day of year (1-365/366)
 */
export const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear;
};

/**
 * Get the week of year (1-52/53)
 */
export const getWeekOfYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/**
 * Get a formatted date string (YYYY-MM-DD)
 */
export const getFormattedDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if two dates are in the same week
 */
export const isSameWeek = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() && getWeekOfYear(date1) === getWeekOfYear(date2);
};

/**
 * Check if two dates are in the same month
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};
