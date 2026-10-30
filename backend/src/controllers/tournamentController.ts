import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Tournament } from '../models/Tournament';
import { Match } from '../models/Match';
import { MatchPayment } from '../models/MatchPayment';
import { Expense } from '../models/Expense';
import { Sponsor } from '../models/Sponsor';
import '../models/Team';

export const getTournaments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, status } = req.query;
    const filter: any = { tenantId: req.user?.tenantId };

    if (teamId) filter.teamId = teamId;
    if (status) filter.status = status;

    const tournaments = await Tournament.find(filter)
      .populate('teamId', 'name shortName primaryColor')
      .sort({ startDate: -1 });

    // Calculate Financial Summary & Match record for each tournament
    const enrichedTournaments = await Promise.all(
      tournaments.map(async (tournament) => {
        const matches = await Match.find({ tournamentId: tournament._id });
        const expenses = await Expense.find({ tournamentId: tournament._id });
        const sponsors = await Sponsor.find({ tournamentId: tournament._id });

        const matchIds = matches.map((m) => m._id);
        const matchPayments = await MatchPayment.find({ matchId: { $in: matchIds } });

        const matchesPlayed = matches.length;
        const matchesWon = matches.filter((m) => m.result === 'won').length;
        const matchesLost = matches.filter((m) => m.result === 'lost').length;

        // Squad Fees:
        const totalFeesCollected = matchPayments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
        const totalFeesAssigned = matchPayments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
        const totalFeesPending = Math.max(0, totalFeesAssigned - totalFeesCollected);

        // Investment: Entry fee + tournament dedicated expenses + match ground costs
        const tournamentExpensesSum = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
        const matchExpensesSum = matches.reduce((acc, m) => acc + (m.totalMatchExpense || 0), 0);
        const totalInvested = (tournament.entryFee || 0) + tournamentExpensesSum + matchExpensesSum;

        // Returns: Winning prizes won + Sponsor funds + Squad fees collected
        const sponsorFunds = sponsors.reduce((acc, s) => acc + (s.amountInvested || 0), 0);
        const matchPrizeWon = matches.reduce(
          (acc, m) => acc + (m.winningPrizeMoney || 0) + (m.momPrizeMoney || 0),
          0
        );
        const totalReturns = (tournament.actualWinningPrizeWon || 0) + sponsorFunds + matchPrizeWon + totalFeesCollected;

        const netPnl = totalReturns - totalInvested;

        return {
          ...tournament.toObject(),
          matchesPlayed,
          matchesWon,
          matchesLost,
          financials: {
            entryFee: tournament.entryFee || 0,
            tournamentExpenses: tournamentExpensesSum,
            matchExpenses: matchExpensesSum,
            totalMatchExpenses: matchExpensesSum,
            totalInvested,
            sponsorFunds,
            totalFeesCollected,
            totalFeesAssigned,
            totalFeesPending,
            actualWinningPrizeWon: tournament.actualWinningPrizeWon || 0,
            matchPrizeWon,
            totalReturns,
            netPnl,
          },
        };
      })
    );

    res.json({ success: true, tournaments: enrichedTournaments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTournamentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findOne({ _id: id, tenantId: req.user?.tenantId }).populate('teamId');
    if (!tournament) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    const matches = await Match.find({ tournamentId: tournament._id })
      .populate('teamId', 'name shortName primaryColor')
      .populate('momPlayerId', 'name')
      .sort({ matchDate: 1 });
    const expenses = await Expense.find({ tournamentId: tournament._id }).sort({ expenseDate: -1 });

    // Sponsors linked to this tournament: either dedicated to it, or with ledger entries tagged to it
    const sponsorDocs = await Sponsor.find({
      tenantId: req.user?.tenantId,
      $or: [{ tournamentId: tournament._id }, { 'transactions.tournamentId': tournament._id }],
    }).sort({ investmentDate: -1 });

    const tournamentIdStr = String(tournament._id);
    const sponsorLedger: any[] = [];
    let sponsorFundsReceived = 0;
    let sponsorPayouts = 0;

    const sponsors = sponsorDocs.map((s) => {
      const isDedicated = String(s.tournamentId || '') === tournamentIdStr;
      // A ledger entry counts for this tournament if explicitly tagged to it,
      // or if it is untagged and the sponsor itself is dedicated to this tournament.
      const txs = (s.transactions || []).filter((t: any) => {
        const txTournament = t.tournamentId ? String(t.tournamentId) : '';
        return txTournament === tournamentIdStr || (!txTournament && isDedicated);
      });

      const tournamentInvested = txs
        .filter((t: any) => t.type === 'investment')
        .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
      const tournamentPaidOut = txs
        .filter((t: any) => t.type === 'payout')
        .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

      sponsorFundsReceived += tournamentInvested;
      sponsorPayouts += tournamentPaidOut;

      txs.forEach((t: any) => {
        sponsorLedger.push({
          _id: t._id,
          sponsorId: s._id,
          sponsorName: s.sponsorName,
          companyName: s.companyName,
          type: t.type,
          amount: t.amount,
          date: t.date,
          method: t.method,
          reference: t.reference,
          notes: t.notes,
        });
      });

      return {
        ...s.toObject(),
        isDedicated,
        tournamentInvested,
        tournamentPaidOut,
        tournamentNet: tournamentInvested - tournamentPaidOut,
      };
    });

    sponsorLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const matchIds = matches.map((m) => m._id);
    const payments = await MatchPayment.find({ matchId: { $in: matchIds } })
      .populate('playerId', 'name phone jerseyNumber role');

    const enrichedMatches = matches.map((m) => {
      const mPayments = payments.filter((p) => String(p.matchId) === String(m._id));
      const totalCollected = mPayments.reduce((sum, p) => sum + (p.feePaid || 0), 0);
      const totalAssigned = mPayments.reduce((sum, p) => sum + (p.feeAssigned || 0), 0);
      const pendingFee = Math.max(0, totalAssigned - totalCollected);
      const paidPlayersCount = mPayments.filter((p) => p.paymentStatus === 'paid').length;

      return {
        ...m.toObject(),
        totalCollected,
        totalAssigned,
        pendingFee,
        paidPlayersCount,
        totalPlayers: mPayments.length,
        payments: mPayments,
      };
    });

    const totalFeesCollected = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
    const totalFeesAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
    const totalFeesPending = Math.max(0, totalFeesAssigned - totalFeesCollected);

    res.json({
      success: true,
      tournament,
      matches: enrichedMatches,
      expenses,
      sponsors,
      sponsorLedger,
      financials: {
        totalFeesCollected,
        totalFeesAssigned,
        totalFeesPending,
        sponsorFundsReceived,
        sponsorPayouts,
        sponsorNet: sponsorFundsReceived - sponsorPayouts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      teamId,
      name,
      organizer,
      venue,
      format,
      startDate,
      endDate,
      entryFee,
      expectedWinningPrize,
      status,
      notes,
    } = req.body;

    if (!teamId || !name || !startDate) {
      res.status(400).json({ success: false, message: 'Team, name, and start date are required' });
      return;
    }

    const tournament = await Tournament.create({
      tenantId: req.user?.tenantId,
      teamId,
      name,
      organizer,
      venue,
      format: format || 'T20',
      startDate,
      endDate,
      entryFee: Number(entryFee) || 0,
      expectedWinningPrize: Number(expectedWinningPrize) || 0,
      status: status || 'ongoing',
      notes,
    });

    res.status(201).json({ success: true, tournament });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findOneAndUpdate(
      { _id: id, tenantId: req.user?.tenantId },
      req.body,
      { new: true }
    );
    if (!tournament) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }
    res.json({ success: true, tournament });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
    if (!tournament) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    // Cascade delete matches, match payments, expenses, and sponsors linked to this tournament
    const tournamentMatches = await Match.find({ tournamentId: id }).select('_id');
    const matchIds = tournamentMatches.map((m) => m._id);
    if (matchIds.length > 0) {
      await MatchPayment.deleteMany({ matchId: { $in: matchIds } });
    }
    await Promise.all([
      Match.deleteMany({ tournamentId: id }),
      Expense.deleteMany({ tournamentId: id }),
      Sponsor.deleteMany({ tournamentId: id }),
    ]);

    res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
