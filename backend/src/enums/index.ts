/**
 * Application enums: the single source of truth for every stored status, type and category.
 * Mongoose schemas use `Object.values(Enum)` for validation, and services compare against
 * these members instead of string literals.
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CAPTAIN = 'captain',
  TREASURER = 'treasurer',
  VIEWER = 'viewer',
}

export enum TeamType {
  MY_TEAM = 'my_team',
  OPPONENT = 'opponent',
}

export enum PlayerRole {
  BATSMAN = 'batsman',
  BOWLER = 'bowler',
  ALL_ROUNDER = 'all_rounder',
  WICKET_KEEPER = 'wicket_keeper',
}

export enum BattingStyle {
  RIGHT_HAND = 'right_hand',
  LEFT_HAND = 'left_hand',
}

export enum BowlingStyle {
  RIGHT_ARM_FAST = 'right_arm_fast',
  RIGHT_ARM_MEDIUM = 'right_arm_medium',
  RIGHT_ARM_SPIN = 'right_arm_spin',
  LEFT_ARM_FAST = 'left_arm_fast',
  LEFT_ARM_SPIN = 'left_arm_spin',
  NONE = 'none',
}

export enum MatchType {
  FRIENDLY = 'friendly',
  TOURNAMENT = 'tournament',
}

export enum MatchStage {
  GROUP = 'group',
  QUARTER_FINAL = 'quarter_final',
  SEMI_FINAL = 'semi_final',
  FINAL = 'final',
  REGULAR = 'regular',
}

export enum MatchResult {
  WON = 'won',
  LOST = 'lost',
  DRAW = 'draw',
  TIED = 'tied',
  UPCOMING = 'upcoming',
  CANCELLED = 'cancelled',
}

export enum TournamentFormat {
  T20 = 'T20',
  TAPE_BALL = 'Tape Ball',
  HARD_BALL = 'Hard Ball',
  T10 = 'T10',
  BALLS_100 = '100 Balls',
  OTHER = 'Other',
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  KNOCKED_OUT = 'knocked_out',
  CHAMPIONS = 'champions',
}

export enum ExpenseCategory {
  KIT_JERSEYS = 'kit_jerseys',
  EQUIPMENT = 'equipment',
  GROUND_BOOKING = 'ground_booking',
  REFRESHMENT = 'refreshment',
  TRANSPORT = 'transport',
  TOURNAMENT_ENTRY_FEE = 'tournament_entry_fee',
  MEDICATION = 'medication',
  OTHER = 'other',
}

export enum PaymentStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  PENDING = 'pending',
}

export enum PaymentMethod {
  CASH = 'cash',
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

export enum PlayerReturnSource {
  WINNING_PRIZE = 'winning_prize',
  SPONSORSHIP = 'sponsorship',
  EXCESS_FEE_REFUND = 'excess_fee_refund',
  CONTRIBUTION_RETURN = 'contribution_return',
  OTHER = 'other',
}

export enum SponsorContractType {
  JERSEY_FRONT = 'jersey_front',
  JERSEY_BACK = 'jersey_back',
  SLEEVE = 'sleeve',
  TOURNAMENT_BANNER = 'tournament_banner',
  EQUIPMENT_KIT = 'equipment_kit',
  GENERAL_GRANT = 'general_grant',
}

export enum SponsorStatus {
  PLEDGED = 'pledged',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum SponsorTxType {
  INVESTMENT = 'investment',
  PAYOUT = 'payout',
}
