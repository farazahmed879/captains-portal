import type { SelectOption } from '../constants';
import { formatDate, formatLabel } from './format';

/**
 * Builders for dropdown options that come from data (players, tournaments, matches,
 * sponsors), so every form labels them the same way.
 */

type PlayerLike = { _id: string; name: string; jerseyNumber?: number | string | null; role?: string | null };
type TournamentLike = { _id: string; name: string; format?: string | null };
type MatchLike = { _id: string; opponentTeam?: string; matchDate?: string | Date; venue?: string | null };
type SponsorLike = { _id: string; sponsorName: string; companyName?: string | null };

const withPlaceholder = (placeholder: string | undefined, options: SelectOption[]) =>
  placeholder !== undefined ? [{ value: '', label: placeholder }, ...options] : options;

/** "Name (#7)", optionally followed by " — All Rounder". */
export const playerOptions = (
  players: PlayerLike[],
  placeholder?: string,
  { withRole = false }: { withRole?: boolean } = {}
): SelectOption[] =>
  withPlaceholder(
    placeholder,
    players.map((p) => ({
      value: p._id,
      label: `${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}${
        withRole && p.role ? ` — ${formatLabel(p.role)}` : ''
      }`,
    }))
  );

/** "Catchy Classic 25 (Hard Ball)". */
export const tournamentOptions = (tournaments: TournamentLike[], placeholder?: string): SelectOption[] =>
  withPlaceholder(
    placeholder,
    tournaments.map((t) => ({ value: t._id, label: t.format ? `${t.name} (${t.format})` : t.name }))
  );

/** "vs Lords CC (07 Nov 2026) - Korangi Eidgah". */
export const matchOptions = (matches: MatchLike[], placeholder?: string): SelectOption[] =>
  withPlaceholder(
    placeholder,
    matches.map((m) => ({
      value: m._id,
      label: `vs ${m.opponentTeam || 'Opponent'} (${formatDate(m.matchDate)})${m.venue ? ` - ${m.venue}` : ''}`,
    }))
  );

/** "CBM Computers (Ali)", or just the sponsor name. */
export const sponsorOptions = (sponsors: SponsorLike[], placeholder?: string): SelectOption[] =>
  withPlaceholder(
    placeholder,
    sponsors.map((s) => ({
      value: s._id,
      label: s.companyName ? `${s.companyName} (${s.sponsorName})` : s.sponsorName,
    }))
  );
