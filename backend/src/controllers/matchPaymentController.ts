import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { MatchPayment } from '../models/MatchPayment';
import { Match } from '../models/Match';

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { matchId, playerId, feeAssigned, feePaid, paymentMethod, paymentDate, notes } = req.body;

    if (!matchId || !playerId) {
      res.status(400).json({ success: false, message: 'Match ID and Player ID are required' });
      return;
    }

    const match = await Match.findOne({ _id: matchId, tenantId: req.user?.tenantId });
    if (!match) {
      res.status(404).json({ success: false, message: 'Match not found' });
      return;
    }

    const assigned = Number(feeAssigned) || 0;
    const paid = Number(feePaid) || 0;
    const status = paid >= assigned && assigned > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';

    const payment = await MatchPayment.findOneAndUpdate(
      { matchId, playerId },
      {
        tenantId: req.user?.tenantId,
        teamId: match.teamId,
        matchId,
        playerId,
        feeAssigned: assigned,
        feePaid: paid,
        paymentStatus: status,
        paymentMethod: paymentMethod || 'cash',
        paymentDate: paymentDate || (paid > 0 ? new Date() : undefined),
        notes,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('playerId', 'name phone role jerseyNumber');

    // Ensure player is added to match squad
    await Match.findByIdAndUpdate(matchId, { $addToSet: { squadPlayerIds: playerId } });

    res.status(201).json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { feeAssigned, feePaid, paymentMethod, paymentDate, notes, transactionRef } = req.body;

    const payment = await MatchPayment.findOne({ _id: id, tenantId: req.user?.tenantId });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    if (feeAssigned !== undefined) {
      payment.feeAssigned = Number(feeAssigned);
    }

    if (feePaid !== undefined) {
      payment.feePaid = Number(feePaid);
    }

    if (payment.feePaid >= payment.feeAssigned && payment.feeAssigned > 0) {
      payment.paymentStatus = 'paid';
    } else if (payment.feePaid > 0) {
      payment.paymentStatus = 'partial';
    } else {
      payment.paymentStatus = 'pending';
    }

    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (paymentDate) payment.paymentDate = new Date(paymentDate);
    if (notes !== undefined) payment.notes = notes;
    if (transactionRef !== undefined) payment.transactionRef = transactionRef;

    await payment.save();
    await payment.populate('playerId', 'name phone role jerseyNumber');
    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await MatchPayment.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    // Optionally remove from squad if no longer tracked
    await Match.findByIdAndUpdate(payment.matchId, { $pull: { squadPlayerIds: payment.playerId } });

    res.json({ success: true, message: 'Squad payment removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUpdatePayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      res.status(400).json({ success: false, message: 'Updates must be an array' });
      return;
    }

    const results = await Promise.all(
      updates.map(async (u) => {
        const payment = await MatchPayment.findOne({ _id: u.id, tenantId: req.user?.tenantId });
        if (!payment) return null;

        if (u.feePaid !== undefined) {
          payment.feePaid = Number(u.feePaid);
          payment.paymentStatus =
            payment.feePaid >= payment.feeAssigned
              ? 'paid'
              : payment.feePaid > 0
              ? 'partial'
              : 'pending';
        }
        if (u.paymentMethod) payment.paymentMethod = u.paymentMethod;
        if (u.paymentDate) payment.paymentDate = new Date(u.paymentDate);
        if (u.notes) payment.notes = u.notes;

        return await payment.save();
      })
    );

    res.json({ success: true, updatedCount: results.filter(Boolean).length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
