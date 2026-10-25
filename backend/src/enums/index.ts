/**
 * Application Enums
 * Centralized, type-safe definitions for all domain models and business logic.
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CAPTAIN = 'captain',
  TREASURER = 'treasurer',
  VIEWER = 'viewer',
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

export enum MatchResult {
  WON = 'won',
  LOST = 'lost',
  TIED = 'tied',
  DRAW = 'draw',
  ABANDONED = 'abandoned',
  PENDING = 'pending',
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ExpenseCategory {
  GROUND_FEE = 'ground_fee',
  BALLS = 'balls',
  REFRESHMENTS = 'refreshments',
  UMPIRE_FEE = 'umpire_fee',
  KITS = 'kits',
  TRAVEL = 'travel',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  WAIVED = 'waived',
  PARTIAL = 'partial',
}

export enum SponsorTier {
  TITLE = 'title',
  CO_SPONSOR = 'co_sponsor',
  KIT = 'kit',
  ASSOCIATE = 'associate',
}

export enum TransactionType {
  INFLOW = 'inflow',
  OUTFLOW = 'outflow',
}
