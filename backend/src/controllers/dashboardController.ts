import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { Tournament } from '../models/Tournament';
import { Expense } from '../models/Expense';
import { Sponsor } from '../models/Sponsor';
import { MatchPayment } from '../models/MatchPayment';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { teamId } = req.query;

    const baseFilter: any = { tenantId };
    if (teamId) baseFilter.teamId = teamId;

    // 1. Teams & Players Counts
    const totalTeams = await Team.countDocuments({ tenantId });
    const totalPlayers = await Player.countDocuments({ tenantId, isActive: true });

    // 2. Matches & Tournaments
    const totalMatches = await Match.countDocuments(baseFilter);
    const friendlyMatches = await Match.countDocuments({ ...baseFilter, matchType: 'friendly' });
    const tournamentMatches = await Match.countDocuments({ ...baseFilter, matchType: 'tournament' });
    const matchesWon = await Match.countDocuments({ ...baseFilter, result: 'won' });
    const matchesLost = await Match.countDocuments({ ...baseFilter, result: 'lost' });

    const totalTournaments = await Tournament.countDocuments(baseFilter);
    const activeTournaments = await Tournament.countDocuments({ ...baseFilter, status: 'ongoing' });

    // 3. Financial Inflow & Outflow
    // Outflow: Expenses + Tournament Entry Fees
    const expenses = await Expense.find(baseFilter);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    const tournaments = await Tournament.find(baseFilter);
    const totalEntryFees = tournaments.reduce((acc, t) => acc + (t.entryFee || 0), 0);

    const matches = await Match.find(baseFilter);
    const matchCosts = matches.reduce((acc, m) => acc + (m.totalMatchExpense || 0), 0);

    const totalInvested = totalExpenses + totalEntryFees;

    // Inflow: Sponsors + Tournament Winning Prizes + Match Prizes
    const sponsors = await Sponsor.find(baseFilter);
    const totalSponsorInvested = sponsors.reduce((acc, s) => acc + (s.amountInvested || 0), 0);
    const totalSponsorReturnsPaid = sponsors.reduce((acc, s) => acc + (s.returnsPaid || 0), 0);
    const netSponsorship = totalSponsorInvested - totalSponsorReturnsPaid;

    const tournamentPrizesWon = tournaments.reduce((acc, t) => acc + (t.actualWinningPrizeWon || 0), 0);
    const matchPrizesWon = matches.reduce((acc, m) => acc + (m.winningPrizeMoney || 0), 0);
    const totalPrizeMoney = tournamentPrizesWon + matchPrizesWon;

    const totalReturns = netSponsorship + totalPrizeMoney;
    const netProfitLoss = totalReturns - totalInvested;

    // 4. Player Match Fees Ledger
    const payments = await MatchPayment.find(baseFilter);
    const totalFeeAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
    const totalFeeCollected = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
    const totalPendingDues = totalFeeAssigned - totalFeeCollected;

    // 5. Recent Matches
    const recentMatches = await Match.find(baseFilter)
      .populate('teamId', 'name shortName primaryColor')
      .populate('tournamentId', 'name')
      .populate('momPlayerId', 'name')
      .sort({ matchDate: -1 })
      .limit(5);

    // 6. Players with highest pending dues
    const players = await Player.find({ tenantId, isActive: true }).select('name phone');
    const playerDues = await Promise.all(
      players.map(async (pl) => {
        const plPayments = await MatchPayment.find({ playerId: pl._id });
        const assigned = plPayments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
        const paid = plPayments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
        return {
          id: pl._id,
          name: pl.name,
          phone: pl.phone,
          assigned,
          paid,
          pending: assigned - paid,
        };
      })
    );
    const topDebtors = playerDues.filter((p) => p.pending > 0).sort((a, b) => b.pending - a.pending).slice(0, 5);

    res.json({
      success: true,
      summary: {
        totalTeams,
        totalPlayers,
        totalMatches,
        friendlyMatches,
        tournamentMatches,
        matchesWon,
        matchesLost,
        winRate: totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0,
        totalTournaments,
        activeTournaments,
      },
      finances: {
        totalInvested,
        totalExpenses,
        totalEntryFees,
        matchCosts,
        totalReturns,
        totalSponsorInvested,
        netSponsorship,
        totalPrizeMoney,
        netProfitLoss,
        totalFeeAssigned,
        totalFeeCollected,
        totalPendingDues,
        collectionRate:
          totalFeeAssigned > 0 ? Math.round((totalFeeCollected / totalFeeAssigned) * 100) : 100,
      },
      recentMatches,
      topDebtors,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
