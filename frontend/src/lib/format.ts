/** Format a number with thousands separators, e.g. 15000 -> "15,000" */
export const formatNumber = (val?: number | null) => (val || 0).toLocaleString('en-US');

/** Format a number as Pakistani Rupees, e.g. 15000 -> "Rs. 15,000" */
export const formatCurrency = (val?: number | null) => `Rs. ${formatNumber(val)}`;

/** Convert snake_case enum values to Title Case, e.g. "all_rounder" -> "All Rounder" */
export const formatLabel = (val?: string | null) =>
  val ? val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
