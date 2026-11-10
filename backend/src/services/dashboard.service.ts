import {
  teamRepository,
  playerRepository,
  matchRepository,
  tournamentRepository,
  expenseRepository,
  sponsorRepository,
  paymentRepository,
  userRepository,
  playerReturnRepository,
} from '../repositories';
import { Tournament as TournamentModel } from '../models/Tournament';
import { UserRole, MatchResult, TournamentStatus } from '../enums';

type Viewer = { id: string; role: string };

export interface MoneyLedgerItem {
  id: string;
  date: string | Date | null;
  category: string;
  description: string;
  detail?: string;
  tournament?: { id: string; name: string } | null;
  link?: string | null;
  amount: number;
  /** 'in' = money received (returns), 'out' = money paid (invested). */
  direction?: 'in' | 'out';
}

const prettyCategory = (c?: string | null) =>
  (c || 'other').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

export interface MoneyLedger {
  kind: 'invested' | 'returns' | 'pnl';
  total: number;
  totalIn?: number;
  totalOut?: number;
  items: MoneyLedgerItem[];
}

const rupees = (v: number) => `Rs. ${v.toLocaleString('en-US')}`;

/**
 * Rolls every line that belongs to a tournament into one line per tournament (with a
 * breakdown by category); lines without a tournament (friendly matches, kit, general
 * sponsors) are kept as they are. Amounts are only summed, so totals are unchanged.
 */
const groupByTournament = (
  raw: MoneyLedgerItem[],
  kind: 'invested' | 'returns' | 'pnl'
): MoneyLedgerItem[] => {
  const standalone: MoneyLedgerItem[] = [];
  const groups = new Map<
    string,
    { name: string; amount: number; moneyIn: number; moneyOut: number; parts: Map<string, number>; date: number }
  >();

  for (const it of raw) {
    if (!it.tournament) {
      standalone.push(it);
      continue;
    }
    const g =
      groups.get(it.tournament.id) ||
      { name: it.tournament.name, amount: 0, moneyIn: 0, moneyOut: 0, parts: new Map<string, number>(), date: 0 };
    g.amount += it.amount;
    if (it.direction === 'out') g.moneyOut += Math.abs(it.amount);
    else g.moneyIn += it.amount;
    g.parts.set(it.category, (g.parts.get(it.category) || 0) + it.amount);
    g.date = Math.max(g.date, new Date(it.date || 0).getTime());
    groups.set(it.tournament.id, g);
  }

  const grouped: MoneyLedgerItem[] = Array.from(groups.entries()).map(([id, g]) => ({
    id: `tournament-${id}`,
    date: g.date ? new Date(g.date) : null,
    category: 'Tournament',
    description: g.name,
    detail:
      kind === 'pnl'
        ? `In ${rupees(g.moneyIn)} · Out ${rupees(g.moneyOut)}`
        : Array.from(g.parts.entries())
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .map(([cat, amt]) => `${cat} ${rupees(Math.abs(amt))}`)
            .join(' · '),
    tournament: null, // the name is the description; the Tournament column is for loose items
    link: `/tournaments/${id}`,
    amount: g.amount,
    direction: kind === 'invested' ? 'out' : kind === 'returns' ? 'in' : g.amount < 0 ? 'out' : 'in',
  }));

  return [...grouped, ...standalone].sort(
    (x, y) => new Date(y.date || 0).getTime() - new Date(x.date || 0).getTime()
  );
};

export class DashboardService {
  /**
   * Which teams' data this user may see on the dashboard (super admins: all teams;
   * everyone else: teams they captain or are enrolled in as a player), and the matching
   * Prisma filter. Shared by the stats cards and the itemised money pages so they agree.
   */
  private async resolveScope(tenantId: string, user: Viewer, teamIdQuery?: string) {
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

    // 0. Valid teams/players for this tenant. This endpoint is read-only: records that
    // reference deleted teams are excluded by the team filter below, never deleted here.
    // (Previously this GET purged payments of inactive players, silently wiping ledger history.)
    const allTenantTeams = await teamRepository.findMany(tenantId);
    const validTenantTeamIds = allTenantTeams.map((t) => t.id);


    let allowedTeamIds: string[] = [];

    if (!isSuperAdmin) {
      const currentUser = await userRepository.findById(user.id);
      let enrolledTeamIds: string[] = [];

      if (currentUser?.playerId) {
        const player = await playerRepository.findById(currentUser.playerId);
        if (player?.teamIds) enrolledTeamIds.push(...player.teamIds);
      }

      const matchingPlayer = await playerRepository.findByMatchingCriteria(tenantId, {
        phone: currentUser?.phone || undefined,
        email: currentUser?.email,
        name: currentUser?.name,
      });

      if (matchingPlayer?.teamIds) {
        enrolledTeamIds.push(...matchingPlayer.teamIds);
      }

      const userTeams = await teamRepository.findByCaptainOrEnrolled(
        tenantId,
        user.id,
        Array.from(new Set(enrolledTeamIds))
      );
      allowedTeamIds = userTeams.map((t) => t.id);
    } else {
      allowedTeamIds = validTenantTeamIds;
    }

    // Determine target team filter
    let teamFilter: any = {};
    if (teamIdQuery) {
      if (isSuperAdmin || allowedTeamIds.includes(teamIdQuery)) {
        teamFilter = { teamId: teamIdQuery };
      } else {
        teamFilter = { teamId: { in: allowedTeamIds } };
      }
    } else {
      teamFilter = { teamId: { in: allowedTeamIds } };
    }

    return { isSuperAdmin, validTenantTeamIds, allowedTeamIds, teamFilter };
  }

  async getStats(tenantId: string, user: Viewer, teamIdQuery?: string) {
    const { isSuperAdmin, validTenantTeamIds, allowedTeamIds, teamFilter } =
      await this.resolveScope(tenantId, user, teamIdQuery);
    const allActivePlayers = await playerRepository.findMany(tenantId, { isActive: true });
    const validPlayerIds = allActivePlayers.map((p) => p.id);

    // 1. Teams & Players Counts
    const totalTeams = isSuperAdmin ? validTenantTeamIds.length : allowedTeamIds.length;
    const totalPlayers = validPlayerIds.length;

    // 2. Matches & Tournaments
    const matches =
      allowedTeamIds.length > 0 ? await matchRepository.findMany(tenantId, teamFilter) : [];
    const totalMatches = matches.length;
    const matchesWon = matches.filter((m) => m.result === MatchResult.WON).length;
    const matchesLost = matches.filter((m) => m.result === MatchResult.LOST).length;
    const winRate = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0;

    const tournaments =
      allowedTeamIds.length > 0 ? await tournamentRepository.findMany(tenantId, teamFilter) : [];
    const totalTournaments = tournaments.length;
    const activeTournaments = tournaments.filter((t) => t.status === TournamentStatus.ONGOING).length;

    // 3. Financial Inflow & Outflow
    const expenses =
      allowedTeamIds.length > 0 ? await expenseRepository.findMany(tenantId, teamFilter) : [];
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalEntryFees = tournaments.reduce((acc, t) => acc + (t.entryFee || 0), 0);
    const totalMatchExpenses = matches.reduce((acc, m) => acc + (m.totalMatchExpense || 0), 0);
    // Advance payments to organizers count as money paid, as on the tournament pages.
    // `advancePayment` exists only in the Mongoose model (not the Prisma schema), so read it there.
    const advanceDocs = tournaments.length
      ? await TournamentModel.find({ _id: { $in: tournaments.map((t) => t.id) }, tenantId })
          .select('advancePayment')
          .lean()
      : [];
    const totalAdvancePayments = advanceDocs.reduce((acc, t: any) => acc + (Number(t.advancePayment) || 0), 0);
    const totalInvested = totalExpenses + totalMatchExpenses + totalAdvancePayments;

    const sponsors =
      allowedTeamIds.length > 0 ? await sponsorRepository.findMany(tenantId, teamFilter) : [];
    const totalSponsorInvested = sponsors.reduce((acc, s) => acc + (s.amountInvested || 0), 0);
    const totalSponsorReturnsPaid = sponsors.reduce((acc, s) => acc + (s.returnsPaid || 0), 0);
    const netSponsorship = totalSponsorInvested - totalSponsorReturnsPaid;

    const tournamentPrizesWon = tournaments.reduce(
      (acc, t) => acc + (t.actualWinningPrizeWon || 0),
      0
    );
    const matchPrizesWon = matches.reduce(
      (acc, m) => acc + (m.winningPrizeMoney || 0) + (m.momPrizeMoney || 0),
      0
    );
    const totalPrizeMoney = tournamentPrizesWon + matchPrizesWon;

    // 4. Player Ledger Fees & Dues
    const payments =
      allowedTeamIds.length > 0
        ? await paymentRepository.findMany(tenantId, teamFilter)
        : [];
    const totalPlayerFeeAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
    const totalPlayerFeeCollected = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
    // Dues are owed per player per match. One player's overpayment must not cancel
    // another player's unpaid fee, so sum each record's shortfall and excess separately.
    const totalPendingDues = payments.reduce(
      (acc, p) => acc + Math.max(0, (p.feeAssigned || 0) - (p.feePaid || 0)),
      0
    );
    const totalOverpaid = payments.reduce(
      (acc, p) => acc + Math.max(0, (p.feePaid || 0) - (p.feeAssigned || 0)),
      0
    );
    // Share of assigned fees actually received (overpayments don't push this past 100%).
    const collectionRate =
      totalPlayerFeeAssigned > 0
        ? Math.round(((totalPlayerFeeAssigned - totalPendingDues) / totalPlayerFeeAssigned) * 100)
        : 0;

    // Money paid back to players (excess-fee refunds, prize shares) reduces fee income.
    const playerReturns =
      allowedTeamIds.length > 0 ? await playerReturnRepository.findMany(tenantId, teamFilter) : [];
    const totalPlayerRefunds = playerReturns.reduce((acc, r) => acc + (r.amount || 0), 0);

    // Total Inflow / Returns: Net Sponsors + Winning Prizes + Player Fees Collected - Refunds to players
    const totalReturns =
      netSponsorship + totalPrizeMoney + totalPlayerFeeCollected - totalPlayerRefunds;
    const netProfitLoss = totalReturns - totalInvested;

    // 5. Recent Matches & Top Debtors
    const recentMatches = matches.slice(0, 5).map((m) => ({ ...m, _id: m.id }));

    // Group pending dues by player
    const playerDuesMap = new Map<string, number>();
    payments.forEach((p) => {
      const due = (p.feeAssigned || 0) - (p.feePaid || 0);
      if (due > 0) {
        playerDuesMap.set(p.playerId, (playerDuesMap.get(p.playerId) || 0) + due);
      }
    });

    const topDebtors = await Promise.all(
      Array.from(playerDuesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([playerId, pendingDue]) => {
          const player = await playerRepository.findById(playerId);
          return {
            _id: playerId,
            id: playerId,
            name: player?.name || 'Squad Member',
            phone: player?.phone,
            jerseyNumber: player?.jerseyNumber,
            pendingDue,
          };
        })
    );

    return {
      summary: {
        totalTeams,
        totalPlayers,
        totalMatches,
        matchesWon,
        matchesLost,
        winRate,
        totalTournaments,
        activeTournaments,
      },
      finances: {
        totalInvested,
        totalReturns,
        netProfitLoss,
        totalPrizeMoney,
        totalSponsorInvested,
        netSponsorship,
        totalPlayerFeeAssigned,
        totalPlayerFeeCollected,
        totalFeeAssigned: totalPlayerFeeAssigned,
        totalFeeCollected: totalPlayerFeeCollected,
        totalPendingDues,
        totalOverpaid,
        totalPlayerRefunds,
        totalAdvancePayments,
        collectionRate,
        totalEntryFees,
        totalExpenses,
        totalMatchExpenses,
      },
      recentMatches,
      topDebtors,
    };
  }

  /**
   * Breakdown behind the dashboard's "Total Invested" ('invested'), "Total Returns" ('returns')
   * or "Net Profit / Loss" ('pnl') card. Everything belonging to a tournament is rolled up into
   * one line per tournament; friendly matches and items not tied to a tournament stay separate.
   * Uses the same scope and rules as getStats, so the lines always add up to the card's figure.
   */
  async getMoneyLedger(
    tenantId: string,
    user: Viewer,
    kind: 'invested' | 'returns' | 'pnl'
  ): Promise<MoneyLedger> {
    if (kind === 'pnl') {
      const [paid, received] = await Promise.all([
        this.buildLedgerItems(tenantId, user, 'invested'),
        this.buildLedgerItems(tenantId, user, 'returns'),
      ]);
      const raw = [...received, ...paid.map((i) => ({ ...i, amount: -i.amount }))];
      const totalIn = received.reduce((acc, i) => acc + i.amount, 0);
      const totalOut = paid.reduce((acc, i) => acc + i.amount, 0);
      return { kind, total: totalIn - totalOut, totalIn, totalOut, items: groupByTournament(raw, kind) };
    }
    const raw = await this.buildLedgerItems(tenantId, user, kind);
    const total = raw.reduce((acc, i) => acc + i.amount, 0);
    return { kind, total, items: groupByTournament(raw, kind) };
  }

  /** Detailed (ungrouped) money lines: one per match, expense, sponsor, prize, fee batch or refund. */
  private async buildLedgerItems(
    tenantId: string,
    user: Viewer,
    kind: 'invested' | 'returns'
  ): Promise<MoneyLedgerItem[]> {
    const { allowedTeamIds, teamFilter } = await this.resolveScope(tenantId, user);
    if (allowedTeamIds.length === 0) return [];

    const none = Promise.resolve([] as any[]);
    const isInvested = kind === 'invested';
    const [matches, tournaments, expensesAll, sponsorsAll, paymentsAll, refundsAll] = await Promise.all([
      matchRepository.findMany(tenantId, teamFilter),
      tournamentRepository.findMany(tenantId, teamFilter),
      isInvested ? expenseRepository.findMany(tenantId, teamFilter) : none,
      isInvested ? none : sponsorRepository.findMany(tenantId, teamFilter),
      isInvested ? none : paymentRepository.findMany(tenantId, teamFilter),
      isInvested ? none : playerReturnRepository.findMany(tenantId, teamFilter),
    ]);
    const tournamentById = new Map(tournaments.map((t) => [t.id, t]));
    const matchById = new Map(matches.map((m) => [m.id, m]));
    const tournamentRef = (id?: string | null) => {
      const t = id ? tournamentById.get(id) : undefined;
      return t ? { id: t.id, name: t.name } : null;
    };
    const items: MoneyLedgerItem[] = [];

    if (kind === 'invested') {
      for (const m of matches) {
        if (!m.totalMatchExpense) continue;
        items.push({
          id: `match-${m.id}`,
          date: m.matchDate,
          category: 'Match costs',
          description: `Ground & match costs vs ${m.opponentTeam}`,
          detail: m.venue,
          tournament: tournamentRef(m.tournamentId),
          link: `/matches/${m.id}`,
          amount: m.totalMatchExpense,
        });
      }

      const advanceDocs = tournaments.length
        ? await TournamentModel.find({ _id: { $in: tournaments.map((t) => t.id) }, tenantId })
            .select('advancePayment')
            .lean()
        : [];
      for (const doc of advanceDocs as any[]) {
        const amount = Number(doc.advancePayment) || 0;
        const t = tournamentById.get(String(doc._id));
        if (!amount || !t) continue;
        items.push({
          id: `advance-${t.id}`,
          date: t.startDate,
          category: 'Tournament advance',
          description: 'Advance paid to organizer',
          tournament: { id: t.id, name: t.name },
          link: `/tournaments/${t.id}`,
          amount,
        });
      }

      for (const e of expensesAll) {
        if (!e.amount) continue;
        items.push({
          id: `expense-${e.id}`,
          date: e.expenseDate,
          category: prettyCategory(e.category),
          description: e.title,
          detail: e.description || undefined,
          tournament: tournamentRef(e.tournamentId),
          link: e.tournamentId ? `/tournaments/${e.tournamentId}` : '/finances',
          amount: e.amount,
        });
      }
    } else {
      for (const sp of sponsorsAll) {
        const net = (sp.amountInvested || 0) - (sp.returnsPaid || 0);
        if (!net) continue;
        items.push({
          id: `sponsor-${sp.id}`,
          date: sp.investmentDate,
          category: 'Sponsorship',
          description: sp.companyName || sp.sponsorName,
          detail: sp.returnsPaid
            ? `Invested ${rupees(sp.amountInvested || 0)} − paid back ${rupees(sp.returnsPaid)}`
            : undefined,
          tournament: tournamentRef(sp.tournamentId),
          link: `/sponsors/${sp.id}`,
          amount: net,
        });
      }

      for (const t of tournaments) {
        if (!t.actualWinningPrizeWon) continue;
        items.push({
          id: `tprize-${t.id}`,
          date: t.endDate || t.startDate,
          category: 'Tournament prize',
          description: 'Winning prize',
          tournament: { id: t.id, name: t.name },
          link: `/tournaments/${t.id}`,
          amount: t.actualWinningPrizeWon,
        });
      }

      for (const m of matches) {
        if (m.winningPrizeMoney) {
          items.push({
            id: `mprize-${m.id}`,
            date: m.matchDate,
            category: 'Match prize',
            description: `Match prize vs ${m.opponentTeam}`,
            tournament: tournamentRef(m.tournamentId),
            link: `/matches/${m.id}`,
            amount: m.winningPrizeMoney,
          });
        }
        if (m.momPrizeMoney) {
          items.push({
            id: `mom-${m.id}`,
            date: m.matchDate,
            category: 'Man of the match',
            description: `MOM prize vs ${m.opponentTeam}`,
            detail: m.momAwardDetails || undefined,
            tournament: tournamentRef(m.tournamentId),
            link: `/matches/${m.id}`,
            amount: m.momPrizeMoney,
          });
        }
      }

      // Squad fees: one line per match (the match page lists each player's payment).
      const feesByMatch = new Map<string, { total: number; players: number; lastPaid: Date | null }>();
      for (const pay of paymentsAll) {
        if (!pay.feePaid) continue;
        const row = feesByMatch.get(pay.matchId) || { total: 0, players: 0, lastPaid: null };
        row.total += pay.feePaid;
        row.players += 1;
        const paidAt = pay.paymentDate || pay.createdAt;
        if (paidAt && (!row.lastPaid || paidAt > row.lastPaid)) row.lastPaid = paidAt;
        feesByMatch.set(pay.matchId, row);
      }
      for (const [matchId, row] of feesByMatch) {
        const m = matchById.get(matchId);
        items.push({
          id: `fees-${matchId}`,
          date: m?.matchDate || row.lastPaid,
          category: 'Squad fees',
          description: m ? `Squad fees vs ${m.opponentTeam}` : 'Squad fees (match deleted)',
          detail: `${row.players} player${row.players === 1 ? '' : 's'} paid`,
          tournament: tournamentRef(m?.tournamentId),
          link: m ? `/matches/${matchId}` : null,
          amount: row.total,
        });
      }

      const refunds = refundsAll;
      if (refunds.length) {
        const players = await playerRepository.findMany(tenantId, {
          id: { in: Array.from(new Set(refunds.map((r) => r.playerId))) },
        });
        const nameById = new Map(players.map((pl) => [pl.id, pl.name]));
        for (const r of refunds) {
          if (!r.amount) continue;
          items.push({
            id: `refund-${r.id}`,
            date: r.returnDate,
            category: 'Refund to player',
            description: `Paid back to ${nameById.get(r.playerId) || 'player'}`,
            detail: prettyCategory(r.source),
            tournament: tournamentRef(r.tournamentId),
            link: `/players/${r.playerId}`,
            amount: -r.amount,
          });
        }
      }
    }

    const direction: 'in' | 'out' = kind === 'invested' ? 'out' : 'in';
    for (const i of items) i.direction = direction;
    return items;
  }
}

export const dashboardService = new DashboardService();
