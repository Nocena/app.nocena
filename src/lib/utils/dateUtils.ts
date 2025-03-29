/**
 * Get the day of the year (1-365/366)
 * @param date The date to get the day of the year for
 * @returns Day of year (1-365/366)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get the week of the year (1-53)
 * @param date The date to get the week of the year for
 * @returns Week of year (1-53)
 */
export function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Get the month of the year (0-11)
 * @param date The date to get the month for
 * @returns Month (0-11)
 */
export function getMonth(date: Date): number {
  return date.getMonth();
}

/**
 * Get the year
 * @param date The date to get the year for
 * @returns Year (e.g., 2023)
 */
export function getYear(date: Date): number {
  return date.getFullYear();
}
