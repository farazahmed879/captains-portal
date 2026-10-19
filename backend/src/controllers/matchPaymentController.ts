import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { MatchPayment } from '../models/MatchPayment';

export const updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { feePaid, paymentMethod, paymentDate, notes, transactionRef } = req.body;

    const payment = await MatchPayment.findOne({ _id: id, tenantId: req.user?.tenantId });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    if (feePaid !== undefined) {
      payment.feePaid = Number(feePaid);
      if (payment.feePaid >= payment.feeAssigned) {
        payment.paymentStatus = 'paid';
      } else if (payment.feePaid > 0) {
        payment.paymentStatus = 'partial';
      } else {
        payment.paymentStatus = 'pending';
      }
    }

    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (paymentDate) payment.paymentDate = new Date(paymentDate);
    if (notes !== undefined) payment.notes = notes;
    if (transactionRef !== undefined) payment.transactionRef = transactionRef;

    await payment.save();
    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUpdatePayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { updates } = req.body; // Array of { id, feePaid, paymentMethod, paymentStatus }
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
