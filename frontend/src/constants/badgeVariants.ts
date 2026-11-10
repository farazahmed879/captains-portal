import type { BadgeVariant } from '../components/ui/Badge';
import { MatchResult, PaymentStatus, SponsorStatus, TournamentStatus } from './enums';

/**
 * Which Badge colour each status/result uses. One source of truth for every page, table
 * and widget, so the same status always looks the same.
 */
const MATCH_RESULT_VARIANT: Partial<Record<string, BadgeVariant>> = {
  [MatchResult.WON]: 'success',
  [MatchResult.LOST]: 'danger',
};

const TOURNAMENT_STATUS_VARIANT: Partial<Record<string, BadgeVariant>> = {
  [TournamentStatus.CHAMPIONS]: 'gold',
  [TournamentStatus.ONGOING]: 'primary',
  [TournamentStatus.COMPLETED]: 'success',
};

const SPONSOR_STATUS_VARIANT: Partial<Record<string, BadgeVariant>> = {
  [SponsorStatus.ACTIVE]: 'success',
  [SponsorStatus.COMPLETED]: 'primary',
};

const PAYMENT_STATUS_VARIANT: Partial<Record<string, BadgeVariant>> = {
  [PaymentStatus.PAID]: 'success',
  [PaymentStatus.PARTIAL]: 'warning',
  [PaymentStatus.PENDING]: 'danger',
};

const lookup = (map: Partial<Record<string, BadgeVariant>>, fallback: BadgeVariant) => (value?: string | null) =>
  (value && map[value.toLowerCase()]) || fallback;

export const getMatchResultVariant = lookup(MATCH_RESULT_VARIANT, 'warning');
export const getTournamentStatusVariant = lookup(TOURNAMENT_STATUS_VARIANT, 'warning');
export const getSponsorStatusVariant = lookup(SPONSOR_STATUS_VARIANT, 'warning');
export const getPaymentStatusVariant = lookup(PAYMENT_STATUS_VARIANT, 'danger');
