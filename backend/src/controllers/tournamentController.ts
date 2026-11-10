import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Tournament } from '../models/Tournament';
import { Match } from '../models/Match';
import { MatchPayment } from '../models/MatchPayment';
import { Expense } from '../models/Expense';
import { Sponsor } from '../models/Sponsor';
import { Team } from '../models/Team';
import { findInvalidTenantRef, stripProtectedFields } from '../utils/tenantGuard';
import { MatchResult, SponsorTxType, PaymentStatus } from '../enums';
import { asyncHandler } from '../utils/asyncHandler';

export const getTournaments = asyncHandler(async (req: AuthRequest, res: Response) => {
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
      const matchesWon = matches.filter((m) => m.result === MatchResult.WON).length;
      const matchesLost = matches.filter((m) => m.result === MatchResult.LOST).length;

      // Squad Fees:
      const totalFeesCollected = matchPayments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
      const totalFeesAssigned = matchPayments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
      const totalFeesPending = Math.max(0, totalFeesAssigned - totalFeesCollected);

      // Tournament Entry Fee Ledger & Total Paid:
      // Entry Fee is the overall contract fee; actual cash paid is Advance Payment + Match Ground Costs + Extra Payments
      const entryFee = tournament.entryFee || 0;
      const advancePayment = tournament.advancePayment || 0;
      const tournamentExpensesSum = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      const matchExpensesSum = matches.reduce((acc, m) => acc + (m.totalMatchExpense || 0), 0);
      const totalPaid = advancePayment + matchExpensesSum + tournamentExpensesSum;
      const totalInvested = totalPaid;

      // Returns: Winning prizes won + Sponsor funds + Squad fees collected
      const sponsorFunds = sponsors.reduce((acc, s) => acc + (s.amountInvested || 0), 0);
      const matchPrizeWon = matches.reduce(
        (acc, m) => acc + (m.winningPrizeMoney || 0) + (m.momPrizeMoney || 0),
        0
      );
      const actualWinningPrizeWon = tournament.actualWinningPrizeWon || 0;
      const totalReturns = actualWinningPrizeWon + sponsorFunds + matchPrizeWon + totalFeesCollected;

      const entryFeeAfterAdvanceAndPrize = Math.max(
        0,
        entryFee - advancePayment - actualWinningPrizeWon - matchPrizeWon
      );
      // The entry fee is the target the organizer balance is tracked against: everything
      // paid (advance + all ground/match costs + extra payments) and prizes reduce it,
      // not only ground costs marked "Reimbursed in Entry Fee".
      const entryFeeBalance = Math.max(
        0,
        entryFee - totalPaid - actualWinningPrizeWon - matchPrizeWon
      );
      const netPnl = totalReturns - totalPaid;

      return {
        ...tournament.toObject(),
        matchesPlayed,
        matchesWon,
        matchesLost,
        financials: {
          entryFee,
          advancePayment,
          entryFeeAfterAdvanceAndPrize,
          entryFeeBalance,
          tournamentExpenses: tournamentExpensesSum,
          extraPayments: tournamentExpensesSum,
          matchExpenses: matchExpensesSum,
          totalMatchExpenses: matchExpensesSum,
          totalPaid,
          totalInvested,
          sponsorFunds,
          totalFeesCollected,
          totalFeesAssigned,
          totalFeesPending,
          actualWinningPrizeWon,
          matchPrizeWon,
          totalReturns,
          netPnl,
        },
      };
    })
  );

  res.json({ success: true, tournaments: enrichedTournaments });
});

export const getTournamentById = asyncHandler(async (req: AuthRequest, res: Response) => {
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
      .filter((t: any) => t.type === SponsorTxType.INVESTMENT)
      .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    const tournamentPaidOut = txs
      .filter((t: any) => t.type === SponsorTxType.PAYOUT)
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
    const paidPlayersCount = mPayments.filter((p) => p.paymentStatus === PaymentStatus.PAID).length;

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
});

export const createTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    teamId,
    name,
    organizer,
    venue,
    format,
    startDate,
    endDate,
    entryFee,
    advancePayment,
    expectedWinningPrize,
    actualWinningPrizeWon,
    status,
    notes,
  } = req.body;

  if (!teamId || !name) {
    res.status(400).json({ success: false, message: 'Team and tournament name are required' });
    return;
  }

  const invalidRef = await findInvalidTenantRef(req.user?.tenantId, [
    { model: Team, ids: teamId, label: 'Team' },
  ]);
  if (invalidRef) {
    res.status(400).json({ success: false, message: invalidRef });
    return;
  }

  const tournament = await Tournament.create({
    tenantId: req.user?.tenantId,
    teamId,
    name,
    organizer,
    venue,
    format: format || 'T20',
    startDate: startDate || new Date(),
    endDate,
    entryFee: Number(entryFee) || 0,
    advancePayment: Number(advancePayment) || 0,
    expectedWinningPrize: Number(expectedWinningPrize) || 0,
    actualWinningPrizeWon: Number(actualWinningPrizeWon) || 0,
    status: status || 'ongoing',
    notes,
  });

  res.status(201).json({ success: true, tournament });
});

export const updateTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = stripProtectedFields(req.body);

  const invalidRef = await findInvalidTenantRef(req.user?.tenantId, [
    { model: Team, ids: updates.teamId, label: 'Team' },
  ]);
  if (invalidRef) {
    res.status(400).json({ success: false, message: invalidRef });
    return;
  }

  const tournament = await Tournament.findOneAndUpdate(
    { _id: id, tenantId: req.user?.tenantId },
    updates,
    { new: true }
  );
  if (!tournament) {
    res.status(404).json({ success: false, message: 'Tournament not found' });
    return;
  }
  res.json({ success: true, tournament });
});

export const deleteTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tournament = await Tournament.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
  if (!tournament) {
    res.status(404).json({ success: false, message: 'Tournament not found' });
    return;
  }

  // Cascade delete matches, match payments, expenses, and sponsors linked to this tournament
  const tenantId = req.user?.tenantId;
  const tournamentMatches = await Match.find({ tournamentId: id, tenantId }).select('_id');
  const matchIds = tournamentMatches.map((m) => m._id);
  if (matchIds.length > 0) {
    await MatchPayment.deleteMany({ matchId: { $in: matchIds }, tenantId });
  }
  await Promise.all([
    Match.deleteMany({ tournamentId: id, tenantId }),
    Expense.deleteMany({ tournamentId: id, tenantId }),
    Sponsor.deleteMany({ tournamentId: id, tenantId }),
  ]);

  res.json({ success: true, message: 'Tournament deleted successfully' });
});
