/** Format a number with thousands separators, e.g. 15000 -> "15,000" */
export const formatNumber = (val?: number | null) => (val || 0).toLocaleString('en-US');

/** Format a number as Pakistani Rupees, e.g. 15000 -> "Rs. 15,000" */
export const formatCurrency = (val?: number | null) => `Rs. ${formatNumber(val)}`;

/** Convert snake_case enum values to Title Case, e.g. "all_rounder" -> "All Rounder" */
export const formatLabel = (val?: string | null) =>
  val ? val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a date string, Date object, or timestamp with short month name, e.g. "03 Nov 2026"
 */
export const formatDate = (
  val?: string | Date | number | null,
  fallback = '-'
): string => {
  if (!val) return fallback;

  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const [y, m, d] = val.trim().split('-').map(Number);
    const monthName = SHORT_MONTHS[m - 1];
    if (monthName && d && y) {
      return `${String(d).padStart(2, '0')} ${monthName} ${y}`;
    }
  }

  const date = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(date.getTime())) return fallback;

  const day = String(date.getDate()).padStart(2, '0');
  const month = SHORT_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format a date with short weekday and short month name, e.g. "Tue, 03 Nov 2026"
 */
export const formatDateWithDay = (
  val?: string | Date | number | null,
  fallback = '-'
): string => {
  if (!val) return fallback;

  const date =
    typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())
      ? (() => {
          const [y, m, d] = val.trim().split('-').map(Number);
          return new Date(y, m - 1, d);
        })()
      : val instanceof Date
      ? val
      : new Date(val);

  if (Number.isNaN(date.getTime())) return fallback;

  const weekday = SHORT_WEEKDAYS[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = SHORT_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};
