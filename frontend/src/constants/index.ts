/**
 * Application Constants and Select Options
 * Reusable select options, labels, and constants across the portal
 */

import {
  PlayerReturnSource,
  PaymentMethod,
  PaymentStatus,
  PlayerRole,
  BattingStyle,
  BowlingStyle,
  MatchResult,
  MatchStage,
  MatchType,
  ExpenseCategory,
  SponsorContractType,
  SponsorStatus,
  TournamentFormat,
  TournamentStatus,
  SponsorTxType,
} from './enums';

export * from './enums';
export * from './assets';

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

// ==========================================
// PLAYER RETURN / REFUND OPTIONS
// ==========================================
export const PLAYER_RETURN_SOURCE_OPTIONS: SelectOption<PlayerReturnSource>[] = [
  { value: PlayerReturnSource.EXCESS_FEE_REFUND, label: 'Excess Fee Refund' },
  { value: PlayerReturnSource.WINNING_PRIZE, label: 'Winning Prize Share' },
  { value: PlayerReturnSource.SPONSORSHIP, label: 'Sponsor Payout' },
  { value: PlayerReturnSource.CONTRIBUTION_RETURN, label: 'Contribution Return' },
  { value: PlayerReturnSource.OTHER, label: 'Other Return / Adjustment' },
];

export const getPlayerReturnSourceLabel = (src?: string): string => {
  const match = PLAYER_RETURN_SOURCE_OPTIONS.find((opt) => opt.value === src);
  return match?.label || 'Other';
};

// ==========================================
// PAYMENT METHOD OPTIONS
// ==========================================
export const PAYMENT_METHOD_OPTIONS: SelectOption<PaymentMethod>[] = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: PaymentMethod.EASYPAISA, label: 'EasyPaisa' },
  { value: PaymentMethod.JAZZCASH, label: 'JazzCash' },
  { value: PaymentMethod.CHEQUE, label: 'Cheque' },
  { value: PaymentMethod.OTHER, label: 'Other' },
];

export const getPaymentMethodLabel = (method?: string): string => {
  const match = PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === method);
  return match?.label || (method ? method.replace(/_/g, ' ') : 'Cash');
};

// ==========================================
// PLAYER ROLE OPTIONS
// ==========================================
export const PLAYER_ROLE_OPTIONS: SelectOption<PlayerRole>[] = [
  { value: PlayerRole.BATSMAN, label: 'Batsman' },
  { value: PlayerRole.BOWLER, label: 'Bowler' },
  { value: PlayerRole.ALL_ROUNDER, label: 'All-Rounder' },
  { value: PlayerRole.WICKET_KEEPER, label: 'Wicket Keeper' },
];

export const PLAYER_SORT_OPTIONS = [
  { value: 'name', label: 'Sort: Name (A-Z)' },
  { value: 'due', label: 'Sort: Due (High → Low)' },
  { value: 'matches', label: 'Sort: Matches Played' },
];

export const getPlayerRoleLabel = (role?: string): string => {
  const match = PLAYER_ROLE_OPTIONS.find((opt) => opt.value === role);
  return match?.label || (role ? role.replace(/_/g, ' ') : 'Player');
};

// ==========================================
// BATTING & BOWLING STYLES
// ==========================================
export const BATTING_STYLE_OPTIONS: SelectOption<BattingStyle>[] = [
  { value: BattingStyle.RIGHT_HAND, label: 'Right-hand Bat' },
  { value: BattingStyle.LEFT_HAND, label: 'Left-hand Bat' },
];

export const BOWLING_STYLE_OPTIONS: SelectOption<BowlingStyle>[] = [
  { value: BowlingStyle.RIGHT_ARM_FAST, label: 'Right-arm Fast' },
  { value: BowlingStyle.RIGHT_ARM_MEDIUM, label: 'Right-arm Medium' },
  { value: BowlingStyle.RIGHT_ARM_SPIN, label: 'Right-arm Spin' },
  { value: BowlingStyle.LEFT_ARM_FAST, label: 'Left-arm Fast' },
  { value: BowlingStyle.LEFT_ARM_MEDIUM, label: 'Left-arm Medium' },
  { value: BowlingStyle.LEFT_ARM_SPIN, label: 'Left-arm Spin' },
  { value: BowlingStyle.NONE, label: 'None' },
];

// ==========================================
// MATCH RESULT & STAGE OPTIONS
// ==========================================
export const MATCH_RESULT_OPTIONS: SelectOption<MatchResult>[] = [
  { value: MatchResult.WON, label: 'Won' },
  { value: MatchResult.LOST, label: 'Lost' },
  { value: MatchResult.TIED, label: 'Tied' },
  { value: MatchResult.ABANDONED, label: 'Abandoned' },
  { value: MatchResult.UPCOMING, label: 'Upcoming' },
];

export const MATCH_STAGE_OPTIONS: SelectOption<MatchStage>[] = [
  { value: MatchStage.REGULAR, label: 'Regular' },
  { value: MatchStage.GROUP, label: 'Group Stage' },
  { value: MatchStage.QUARTER_FINAL, label: 'Quarter Final' },
  { value: MatchStage.SEMI_FINAL, label: 'Semi Final' },
  { value: MatchStage.FINAL, label: 'Final' },
];

// ==========================================
// MATCH TYPE & STAGE OPTIONS
// ==========================================
export const MATCH_TYPE_OPTIONS: SelectOption<MatchType | string>[] = [
  { value: MatchType.TOURNAMENT, label: 'Tournament / Cup Match' },
  { value: MatchType.FRIENDLY, label: 'Friendly / Practice Match' },
];

// ==========================================
// TOURNAMENT OPTIONS
// ==========================================
export const TOURNAMENT_FORMAT_OPTIONS: SelectOption<TournamentFormat | string>[] = [
  { value: TournamentFormat.HARD_BALL, label: 'Hard Ball' },
  { value: TournamentFormat.TAPE_BALL, label: 'Tape Ball' },
  { value: TournamentFormat.T20, label: 'T20' },
  { value: TournamentFormat.T10, label: 'T10' },
  { value: TournamentFormat.BALLS_100, label: '100 Balls' },
];

export const TOURNAMENT_STATUS_OPTIONS: SelectOption<TournamentStatus | string>[] = [
  { value: TournamentStatus.UPCOMING, label: 'Upcoming' },
  { value: TournamentStatus.ONGOING, label: 'Ongoing' },
  { value: TournamentStatus.COMPLETED, label: 'Completed' },
  { value: TournamentStatus.CHAMPIONS, label: 'Champions' },
];

// ==========================================
// EXPENSE CATEGORY OPTIONS
// ==========================================
export const EXPENSE_CATEGORY_OPTIONS: SelectOption<string>[] = [
  { value: 'kit_jerseys', label: 'Jerseys & Uniforms' },
  { value: 'equipment', label: 'Equipment & Gear' },
  { value: 'ground_booking', label: 'Ground Rent / Booking' },
  { value: 'refreshment', label: 'Refreshments & Water' },
  { value: 'transport', label: 'Transport & Logistics' },
  { value: 'tournament_entry_fee', label: 'Tournament Entry Fee' },
  { value: 'medication', label: 'First Aid & Medical' },
  { value: 'other', label: 'Other Expenditure' },
];

// ==========================================
// SPONSOR OPTIONS
// ==========================================
export const SPONSOR_CONTRACT_OPTIONS: SelectOption<SponsorContractType | string>[] = [
  { value: 'jersey_front', label: 'Jersey Front Chest Logo' },
  { value: 'jersey_back', label: 'Jersey Back Logo' },
  { value: 'sleeve', label: 'Sleeve Logo' },
  { value: 'tournament_banner', label: 'Tournament Banners' },
  { value: 'equipment_kit', label: 'Equipment & Kit Bag' },
  { value: 'general_grant', label: 'General Annual Grant' },
];

export const SPONSOR_STATUS_OPTIONS: SelectOption<SponsorStatus | string>[] = [
  { value: 'pledged', label: 'Pledged' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export const SPONSOR_TX_TYPE_OPTIONS: SelectOption<SponsorTxType>[] = [
  { value: 'investment', label: 'Investment / Funding In' },
  { value: 'payout', label: 'Payout / Distribution Out' },
];
