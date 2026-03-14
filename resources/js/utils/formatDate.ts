/**
 * Formats a date string into a human-readable format.
 *
 * @example formatDate('2026-03-15') → 'Saturday, March 15, 2026'
 */
export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
