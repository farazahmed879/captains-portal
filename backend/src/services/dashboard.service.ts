import {
  teamRepository,
  playerRepository,
  matchRepository,
  tournamentRepository,
  expenseRepository,
  sponsorRepository,
  paymentRepository,
  userRepository,
} from '../repositories';
import { UserRole } from '../enums';

export class DashboardService {
  async getStats(tenantId: string, user: { id: string; role: string }, teamIdQuery?: string) {
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
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
    }

    // Determine target team filter
    let teamFilter: any = {};
    if (teamIdQuery) {
      if (isSuperAdmin || allowedTeamIds.includes(teamIdQuery)) {
        teamFilter = { teamId: teamIdQuery };
      } else {
        teamFilter = { teamId: { in: allowedTeamIds } };
      }
    } else if (!isSuperAdmin) {
      teamFilter = { teamId: { in: allowedTeamIds } };
    }

    // 1. Teams & Players Counts
    const totalTeams = isSuperAdmin
      ? await teamRepository.count(tenantId)
      : allowedTeamIds.length;
    const totalPlayers = await playerRepository.count(tenantId, { isActive: true });

    // 2. Matches & Tournaments
    const matches = await matchRepository.findMany(tenantId, teamFilter);
    const totalMatches = matches.length;
    const matchesWon = matches.filter((m) => m.result === 'won').length;
    const matchesLost = matches.filter((m) => m.result === 'lost').length;

    const tournaments = await tournamentRepository.findMany(tenantId, teamFilter);
    const totalTournaments = tournaments.length;
    const activeTournaments = tournaments.filter((t) => t.status === 'ongoing').length;

    // 3. Financial Inflow & Outflow
    const expenses = await expenseRepository.findMany(tenantId, teamFilter);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalEntryFees = tournaments.reduce((acc, t) => acc + (t.entryFee || 0), 0);
    const totalInvested = totalExpenses + totalEntryFees;

    const sponsors = await sponsorRepository.findMany(tenantId, teamFilter);
    const totalSponsorInvested = sponsors.reduce((acc, s) => acc + (s.amountInvested || 0), 0);
    const totalSponsorReturnsPaid = sponsors.reduce((acc, s) => acc + (s.returnsPaid || 0), 0);
    const netSponsorship = totalSponsorInvested - totalSponsorReturnsPaid;

    const tournamentPrizesWon = tournaments.reduce((acc, t) => acc + (t.actualWinningPrizeWon || 0), 0);
    const matchPrizesWon = matches.reduce((acc, m) => acc + (m.winningPrizeMoney || 0), 0);
    const totalPrizeMoney = tournamentPrizesWon + matchPrizesWon;

    const totalReturns = netSponsorship + totalPrizeMoney;
    const netProfitLoss = totalReturns - totalInvested;

    // 4. Player Ledger Fees & Dues
    const payments = await paymentRepository.findMany(tenantId, teamFilter);
    const totalPlayerFeeAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
    const totalPlayerFeeCollected = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
    const totalPendingDues = Math.max(0, totalPlayerFeeAssigned - totalPlayerFeeCollected);
    const collectionRate =
      totalPlayerFeeAssigned > 0
        ? Math.round((totalPlayerFeeCollected / totalPlayerFeeAssigned) * 100)
        : 100;

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
        totalTournaments,
        activeTournaments,
      },
      finances: {
        totalInvested,
        totalReturns,
        netProfitLoss,
        totalPlayerFeeAssigned,
        totalPlayerFeeCollected,
        totalPendingDues,
        collectionRate,
      },
      recentMatches,
      topDebtors,
    };
  }
}

export const dashboardService = new DashboardService();
