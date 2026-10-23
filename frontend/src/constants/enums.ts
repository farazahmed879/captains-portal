/**
 * Application Enums
 * Standardized enumerations for captain's portal
 */

export enum PlayerReturnSource {
  EXCESS_FEE_REFUND = 'excess_fee_refund',
  WINNING_PRIZE = 'winning_prize',
  SPONSORSHIP = 'sponsorship',
  CONTRIBUTION_RETURN = 'contribution_return',
  OTHER = 'other',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

export enum PaymentStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  PENDING = 'pending',
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
  LEFT_ARM_FAST = 'left_arm_fast',
  LEFT_ARM_MEDIUM = 'left_arm_medium',
  RIGHT_ARM_SPIN = 'right_arm_spin',
  LEFT_ARM_SPIN = 'left_arm_spin',
  NONE = 'none',
}

export enum MatchResult {
  WON = 'won',
  LOST = 'lost',
  TIED = 'tied',
  ABANDONED = 'abandoned',
  UPCOMING = 'upcoming',
}

export enum MatchType {
  TOURNAMENT = 'tournament',
  FRIENDLY = 'friendly',
}

export enum MatchStage {
  REGULAR = 'regular',
  GROUP = 'group',
  QUARTER_FINAL = 'quarter_final',
  SEMI_FINAL = 'semi_final',
  FINAL = 'final',
}

export enum ExpenseCategory {
  GROUND = 'ground',
  BALL = 'ball',
  REFRESHMENT = 'refreshment',
  UMPIRE = 'umpire',
  SCORER = 'scorer',
  KIT = 'kit',
  TRANSPORT = 'transport',
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

export enum TournamentFormat {
  HARD_BALL = 'Hard Ball',
  TAPE_BALL = 'Tape Ball',
  T20 = 'T20',
  T10 = 'T10',
  BALLS_100 = '100 Balls',
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CHAMPIONS = 'champions',
}

export type SponsorTxType = 'investment' | 'payout';

