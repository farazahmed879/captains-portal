import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Match } from '../models/Match';
import { MatchPayment } from '../models/MatchPayment';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { Tournament } from '../models/Tournament';
import { findInvalidTenantRef, stripProtectedFields } from '../utils/tenantGuard';
import { PaymentStatus } from '../enums';
import { asyncHandler } from '../utils/asyncHandler';

/** Ensures every team/tournament/player referenced by a match body belongs to the caller's tenant. */
const findInvalidMatchRef = (tenantId: string | undefined, body: any) =>
  findInvalidTenantRef(tenantId, [
    { model: Team, ids: body.teamId, label: 'Team' },
    { model: Tournament, ids: body.tournamentId, label: 'Tournament' },
    { model: Player, ids: body.squadPlayerIds, label: 'Squad player' },
    { model: Player, ids: body.momPlayerId === 'none' ? undefined : body.momPlayerId, label: 'Man of the match player' },
  ]);

export const getMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId, matchType, tournamentId } = req.query;
  const filter: any = { tenantId: req.user?.tenantId };

  if (teamId) filter.teamId = teamId;
  if (matchType) filter.matchType = matchType;
  if (tournamentId) filter.tournamentId = tournamentId;

  const matches = await Match.find(filter)
    .populate('teamId', 'name shortName primaryColor')
    .populate('tournamentId', 'name format')
    .populate('momPlayerId', 'name role')
    .populate('squadPlayerIds', 'name role phone')
    .sort({ matchDate: -1 });

  // Enrich with collection summary (total fee collected vs total fee assigned)
  const enrichedMatches = await Promise.all(
    matches.map(async (m) => {
      const payments = await MatchPayment.find({ matchId: m._id });
      const totalCollected = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
      const totalAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
      const paidCount = payments.filter((p) => p.paymentStatus === PaymentStatus.PAID).length;
      const pendingCount = payments.filter((p) => p.paymentStatus !== 'paid').length;

      return {
        ...m.toObject(),
        totalCollected,
        totalAssigned,
        pendingFee: totalAssigned - totalCollected,
        paidPlayersCount: paidCount,
        pendingPlayersCount: pendingCount,
      };
    })
  );

  res.json({ success: true, matches: enrichedMatches });
});

export const getMatchById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const match = await Match.findOne({ _id: id, tenantId: req.user?.tenantId })
    .populate('teamId')
    .populate('tournamentId')
    .populate('momPlayerId')
    .populate('squadPlayerIds');

  if (!match) {
    res.status(404).json({ success: false, message: 'Match not found' });
    return;
  }

  const payments = await MatchPayment.find({ matchId: match._id })
    .populate('playerId', 'name phone role jerseyNumber')
    .sort({ createdAt: 1 });

  res.json({ success: true, match, payments });
});

export const createMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    teamId,
    matchType,
    tournamentId,
    tournamentStage,
    matchDate,
    opponentTeam,
    venue,
    overs,
    groundCost,
    umpireCost,
    ballCost,
    refreshmentCost,
    otherCosts,
    perPlayerFee,
    squadPlayerIds,
    result,
    teamScore,
    opponentScore,
    winningPrizeMoney,
    momPlayerId,
    momAwardDetails,
    momPrizeMoney,
    notes,
  } = req.body;

  if (!teamId || !opponentTeam || !venue || !matchDate) {
    res.status(400).json({ success: false, message: 'Team, opponent, venue, and date are required' });
    return;
  }

  const invalidRef = await findInvalidMatchRef(req.user?.tenantId, req.body);
  if (invalidRef) {
    res.status(400).json({ success: false, message: invalidRef });
    return;
  }

  const ground =
    groundCost !== undefined
      ? Number(groundCost) || 0
      : Number(req.body.totalMatchExpense) || 0;
  const umpire = Number(umpireCost) || 0;
  const ball = Number(ballCost) || 0;
  const refresh = Number(refreshmentCost) || 0;
  const other = Number(otherCosts) || 0;
  const totalMatchExpense = ground + umpire + ball + refresh + other;
  const resolvedStage = tournamentStage || req.body.stage || 'group';

  // Default per player fee calculation if not explicitly provided
  let calculatedPerPlayerFee = Number(perPlayerFee) || 0;
  const squad = squadPlayerIds || [];
  if (!calculatedPerPlayerFee && squad.length > 0 && totalMatchExpense > 0) {
    calculatedPerPlayerFee = Math.ceil(totalMatchExpense / squad.length);
  }

  const match = await Match.create({
    tenantId: req.user?.tenantId,
    teamId,
    matchType: matchType || 'friendly',
    tournamentId: matchType === 'tournament' ? tournamentId : undefined,
    tournamentStage: matchType === 'tournament' ? resolvedStage : undefined,
    matchDate,
    opponentTeam,
    venue,
    overs: Number(overs) || 20,
    groundCost: ground,
    umpireCost: umpire,
    ballCost: ball,
    refreshmentCost: refresh,
    otherCosts: other,
    totalMatchExpense,
    perPlayerFee: calculatedPerPlayerFee,
    squadPlayerIds: squad,
    result: result || 'upcoming',
    teamScore,
    opponentScore,
    winningPrizeMoney: Number(winningPrizeMoney) || 0,
    momPlayerId: momPlayerId || undefined,
    momAwardDetails,
    momPrizeMoney: Number(momPrizeMoney) || 0,
    isReimbursed: req.body.isReimbursed !== undefined ? Boolean(req.body.isReimbursed) : false,
    reimbursedAmount:
      req.body.isReimbursed
        ? req.body.reimbursedAmount !== undefined
          ? Number(req.body.reimbursedAmount)
          : ground || totalMatchExpense
        : 0,
    notes,
  });

  // Automatically create payment records for each squad player
  if (squad.length > 0) {
    const paymentDocs = squad.map((playerId: string) => ({
      tenantId: req.user?.tenantId,
      teamId,
      matchId: match._id,
      playerId,
      feeAssigned: calculatedPerPlayerFee,
      feePaid: 0,
      paymentStatus: 'pending',
    }));
    await MatchPayment.insertMany(paymentDocs);
  }

  res.status(201).json({ success: true, match });
});

export const updateMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  req.body = stripProtectedFields(req.body);

  const existing = await Match.findOne({ _id: id, tenantId: req.user?.tenantId });
  if (!existing) {
    res.status(404).json({ success: false, message: 'Match not found' });
    return;
  }

  const invalidRef = await findInvalidMatchRef(req.user?.tenantId, req.body);
  if (invalidRef) {
    res.status(400).json({ success: false, message: invalidRef });
    return;
  }

  // Recalculate total expense if costs changed
  const hasAnyCostField =
    req.body.groundCost !== undefined ||
    req.body.umpireCost !== undefined ||
    req.body.ballCost !== undefined ||
    req.body.refreshmentCost !== undefined ||
    req.body.otherCosts !== undefined;

  if (hasAnyCostField) {
    // Fields not sent keep their stored value (previously they were reset to 0).
    const costOf = (field: 'groundCost' | 'umpireCost' | 'ballCost' | 'refreshmentCost' | 'otherCosts') =>
      req.body[field] !== undefined ? Number(req.body[field]) || 0 : Number(existing[field]) || 0;
    const ground = costOf('groundCost');
    const umpire = costOf('umpireCost');
    const ball = costOf('ballCost');
    const refresh = costOf('refreshmentCost');
    const other = costOf('otherCosts');
    req.body.totalMatchExpense = ground + umpire + ball + refresh + other;
    req.body.groundCost = ground;
    req.body.umpireCost = umpire;
    req.body.ballCost = ball;
    req.body.refreshmentCost = refresh;
    req.body.otherCosts = other;
  } else if (req.body.totalMatchExpense !== undefined && req.body.groundCost === undefined) {
    req.body.groundCost = Number(req.body.totalMatchExpense) || 0;
  }

  if (req.body.momPlayerId === '' || req.body.momPlayerId === 'none') {
    req.body.momPlayerId = null;
  }
  if (req.body.momPrizeMoney !== undefined) {
    req.body.momPrizeMoney = Number(req.body.momPrizeMoney) || 0;
  }

  if (req.body.isReimbursed !== undefined) {
    req.body.isReimbursed = Boolean(req.body.isReimbursed);
    if (req.body.isReimbursed) {
      req.body.reimbursedAmount =
        req.body.reimbursedAmount !== undefined
          ? Number(req.body.reimbursedAmount)
          : req.body.groundCost !== undefined
          ? Number(req.body.groundCost)
          : req.body.totalMatchExpense || 0;
    } else {
      req.body.reimbursedAmount = 0;
    }
  } else if (req.body.reimbursedAmount !== undefined) {
    req.body.reimbursedAmount = Number(req.body.reimbursedAmount) || 0;
    if (req.body.reimbursedAmount > 0) {
      req.body.isReimbursed = true;
    }
  }

  const match = await Match.findOneAndUpdate(
    { _id: id, tenantId: req.user?.tenantId },
    req.body,
    { new: true }
  )
    .populate('teamId')
    .populate('momPlayerId', 'name role jerseyNumber');

  if (!match) {
    res.status(404).json({ success: false, message: 'Match not found' });
    return;
  }

  if (req.body.teamId) {
    await MatchPayment.updateMany(
      { matchId: id, tenantId: req.user?.tenantId },
      { teamId: req.body.teamId }
    );
  }

  res.json({ success: true, match });
});

export const deleteMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const match = await Match.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
  if (!match) {
    res.status(404).json({ success: false, message: 'Match not found' });
    return;
  }
  // Clean up payments for this match
  await MatchPayment.deleteMany({ matchId: id, tenantId: req.user?.tenantId });

  res.json({ success: true, message: 'Match and associated payments deleted successfully' });
});
