/**
 * App-wide copy and defaults. Kept here so pages and forms never hard-code them.
 */
export const APP_INFO = {
  name: 'Captains Portal',
  shortName: 'CAPTAINS',
  tagline: 'Sports Pro',
  /** Highlights listed on the sign-in / register screens. */
  authHighlights: ['Team & player ledgers', 'Match fees and dues', 'Tournament ROI'],
} as const;

/** Shown wherever a value is missing; never substitute made-up data (city, venue, team…). */
export const EMPTY_VALUE = '—';

/** Default values pre-filled in create forms. */
export const FORM_DEFAULTS = {
  teamCity: 'Karachi',
  teamColor: '#0284c7',
  matchOvers: 20,
  squadFee: 1000,
  momPrize: 1000,
} as const;

/** Screen width (px) below which the phone layout is used; must match the CSS media queries. */
export const MOBILE_BREAKPOINT = 640;

/** Page sizes offered under every paginated list, and the size used until the user picks one. */
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

/** Calendar settings for the DatePicker. weekStartsOn: 0 = Sunday, 1 = Monday. */
export const DATE_PICKER = {
  weekStartsOn: 1,
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  weekdayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  yearsPerPage: 12,
} as const;
