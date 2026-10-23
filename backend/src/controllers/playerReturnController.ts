import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PlayerReturn } from '../models/PlayerReturn';
import { Player } from '../models/Player';

export const createPlayerReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { playerId, teamId, amount, returnDate, source, reason, paymentMethod, tournamentId, matchId, transactionRef, notes } = req.body;

    if (!playerId) {
      res.status(400).json({ success: false, message: 'Player ID is required' });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'Valid return amount is required' });
      return;
    }

    const player = await Player.findOne({ _id: playerId, tenantId: req.user?.tenantId });
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }

    const playerReturn = await PlayerReturn.create({
      tenantId: req.user?.tenantId,
      teamId: teamId || (player.teamIds && player.teamIds.length > 0 ? player.teamIds[0] : undefined),
      playerId,
      amount: numAmount,
      returnDate: returnDate ? new Date(returnDate) : new Date(),
      source: source || 'excess_fee_refund',
      reason: reason || '',
      paymentMethod: paymentMethod || 'cash',
      tournamentId: tournamentId || undefined,
      matchId: matchId || undefined,
      transactionRef: transactionRef || '',
      notes: notes || '',
    });

    const populated = await PlayerReturn.findById(playerReturn._id)
      .populate('playerId', 'name phone role jerseyNumber')
      .populate('tournamentId', 'name')
      .populate('matchId', 'opponentTeam matchDate');

    res.status(201).json({ success: true, playerReturn: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlayerReturns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { playerId, teamId, source } = req.query;
    const filter: any = { tenantId: req.user?.tenantId };

    if (playerId) filter.playerId = playerId;
    if (teamId) filter.teamId = teamId;
    if (source) filter.source = source;

    const returns = await PlayerReturn.find(filter)
      .populate('playerId', 'name phone role jerseyNumber')
      .populate('tournamentId', 'name')
      .populate('matchId', 'opponentTeam matchDate')
      .sort({ returnDate: -1, createdAt: -1 });

    const totalReturned = returns.reduce((acc, r) => acc + (r.amount || 0), 0);

    res.json({ success: true, returns, totalReturned });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlayerReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, returnDate, source, reason, paymentMethod, tournamentId, matchId, transactionRef, notes } = req.body;

    const playerReturn = await PlayerReturn.findOne({ _id: id, tenantId: req.user?.tenantId });
    if (!playerReturn) {
      res.status(404).json({ success: false, message: 'Return record not found' });
      return;
    }

    if (amount !== undefined) playerReturn.amount = Number(amount);
    if (returnDate) playerReturn.returnDate = new Date(returnDate);
    if (source) playerReturn.source = source;
    if (reason !== undefined) playerReturn.reason = reason;
    if (paymentMethod) playerReturn.paymentMethod = paymentMethod;
    if (tournamentId !== undefined) playerReturn.tournamentId = tournamentId || undefined;
    if (matchId !== undefined) playerReturn.matchId = matchId || undefined;
    if (transactionRef !== undefined) playerReturn.transactionRef = transactionRef;
    if (notes !== undefined) playerReturn.notes = notes;

    await playerReturn.save();
    await playerReturn.populate('playerId', 'name phone role jerseyNumber');

    res.json({ success: true, playerReturn });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePlayerReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await PlayerReturn.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Return record not found' });
      return;
    }

    res.json({ success: true, message: 'Return record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
