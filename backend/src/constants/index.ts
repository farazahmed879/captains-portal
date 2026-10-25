/**
 * Application Constants
 * Single source of truth for application configuration, status codes, and user messages.
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const AUTH_CONSTANTS = {
  SALT_ROUNDS: 10,
  TOKEN_EXPIRES_IN: '30d',
  DEFAULT_PASSWORD: 'password123',
  BEARER_PREFIX: 'Bearer ',
} as const;

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SYSTEM_DEFAULTS = {
  CITY: 'Karachi',
  PRIMARY_COLOR: '#0284c7',
  APP_NAME: 'Captains Portal API',
} as const;

export const MESSAGES = {
  // Auth
  AUTH_SUCCESS: 'Authenticated successfully',
  LOGIN_REQUIRED_IDENTIFIER: 'Phone number or email is required',
  LOGIN_INVALID_CREDENTIALS: 'The phone or email you entered is not registered.',
  LOGIN_INCORRECT_PASSWORD: 'Incorrect password for this account.',
  ACCOUNT_SUSPENDED: 'Account is deactivated. Please contact your captain or administrator.',
  ACCOUNT_REGISTERED: 'Account registered successfully',
  UNAUTHORIZED_ACCESS: 'Authentication token is missing or invalid',
  SUPER_ADMIN_REQUIRED: 'Super administrator privilege is required for this action',
  FORBIDDEN_ACTION: 'You do not have permission to perform this action',

  // Users
  USER_NOT_FOUND: 'User account not found',
  USER_CREATED: 'User account created successfully',
  USER_ROLE_UPDATED: 'User role updated successfully',
  USER_STATUS_UPDATED: 'User account status updated successfully',
  USER_DELETED: 'User account deleted successfully',
  CANNOT_DEMOTE_LAST_ADMIN: 'Cannot change role: System requires at least one active Super Admin',
  CANNOT_DEACTIVATE_LAST_ADMIN: 'Cannot deactivate the last remaining active Super Admin account',
  CANNOT_DELETE_SELF: 'You cannot delete your own account while actively logged in',
  EMAIL_ALREADY_EXISTS: 'A user with this email address already exists',
  PHONE_ALREADY_EXISTS: 'A user with this phone number already exists',

  // Teams
  TEAM_NOT_FOUND: 'Team not found',
  TEAM_CREATED: 'Team created successfully',
  TEAM_UPDATED: 'Team updated successfully',
  TEAM_DELETED: 'Team deleted successfully',
  TEAM_NAME_REQUIRED: 'Team name and short code are required',

  // Players
  PLAYER_NOT_FOUND: 'Player not found',
  PLAYER_CREATED: 'Player added successfully',
  PLAYER_UPDATED: 'Player updated successfully',
  PLAYER_DELETED: 'Player deleted successfully',

  // Matches
  MATCH_NOT_FOUND: 'Match not found',
  MATCH_CREATED: 'Match created successfully',
  MATCH_UPDATED: 'Match updated successfully',
  MATCH_DELETED: 'Match deleted successfully',

  // Tournaments
  TOURNAMENT_NOT_FOUND: 'Tournament not found',
  TOURNAMENT_CREATED: 'Tournament created successfully',
  TOURNAMENT_UPDATED: 'Tournament updated successfully',
  TOURNAMENT_DELETED: 'Tournament deleted successfully',

  // Expenses & Sponsors
  EXPENSE_NOT_FOUND: 'Expense entry not found',
  EXPENSE_RECORDED: 'Expense recorded successfully',
  SPONSOR_NOT_FOUND: 'Sponsor record not found',
  PAYMENT_RECORDED: 'Payment recorded successfully',

  // Server
  INTERNAL_ERROR: 'An unexpected internal server error occurred',
  ROUTE_NOT_FOUND: 'The requested API route was not found',
} as const;
