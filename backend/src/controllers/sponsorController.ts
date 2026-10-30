import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ISponsor, Sponsor } from '../models/Sponsor';

const TX_TYPES = ['investment', 'payout'];
const TX_METHODS = ['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque', 'other'];

/**
 * Older sponsors only stored running totals. Convert those totals into opening
 * ledger entries so the ledger always explains the balance.
 * Uses a conditional atomic update so concurrent requests can't migrate twice.
 * Returns true if this call performed the migration.
 */
const ensureLedger = async (sponsor: ISponsor): Promise<boolean> => {
  if (sponsor.transactions && sponsor.transactions.length > 0) return false;

  const opening: any[] = [];
  if ((sponsor.amountInvested || 0) > 0) {
    opening.push({
      type: 'investment',
      amount: sponsor.amountInvested,
      date: sponsor.investmentDate || sponsor.createdAt || new Date(),
      method: 'cash',
      notes: 'Opening investment (migrated from previous records)',
    });
  }
  if ((sponsor.returnsPaid || 0) > 0) {
    opening.push({
      type: 'payout',
      amount: sponsor.returnsPaid,
      date: sponsor.returnDate || new Date(),
      method: 'cash',
      notes: 'Opening payout (migrated from previous records)',
    });
  }
  if (opening.length === 0) return false;

  const result = await Sponsor.updateOne(
    {
      _id: sponsor._id,
      $or: [{ transactions: { $exists: false } }, { transactions: { $size: 0 } }],
    },
    { $set: { transactions: opening } }
  );
  return result.modifiedCount > 0;
};

const populateSponsor = (id: any, tenantId: any) =>
  Sponsor.findOne({ _id: id, tenantId })
    .populate('teamId', 'name shortName primaryColor')
    .populate('tournamentId', 'name format venue')
    .populate('transactions.tournamentId', 'name');

export const getSponsors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, tournamentId, status } = req.query;
    const filter: any = { tenantId: req.user?.tenantId };

    if (teamId) filter.teamId = teamId;
    if (tournamentId) filter.tournamentId = tournamentId;
    if (status) filter.status = status;

    const sponsors = await Sponsor.find(filter)
      .populate('teamId', 'name shortName primaryColor')
      .populate('tournamentId', 'name')
      .sort({ investmentDate: -1 });

    // Lazily migrate legacy sponsors into the ledger format
    for (const s of sponsors) {
      await ensureLedger(s);
    }

    const totalInvested = sponsors.reduce((acc, s) => acc + (s.amountInvested || 0), 0);
    const totalReturnsPaid = sponsors.reduce((acc, s) => acc + (s.returnsPaid || 0), 0);
    const netRetained = totalInvested - totalReturnsPaid;

    res.json({
      success: true,
      totalInvested,
      totalReturnsPaid,
      netRetained,
      sponsors,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSponsor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      teamId,
      tournamentId,
      sponsorName,
      companyName,
      phone,
      email,
      amountInvested,
      investmentDate,
      paymentMethod,
      contractType,
      deliverablesAgreed,
      status,
      notes,
    } = req.body;

    if (!teamId || !sponsorName || amountInvested === undefined) {
      res.status(400).json({ success: false, message: 'Team, sponsor name, and amount invested are required' });
      return;
    }

    const initialAmount = Number(amountInvested) || 0;
    const initialDate = investmentDate ? new Date(investmentDate) : new Date();

    const sponsor = new Sponsor({
      tenantId: req.user?.tenantId,
      teamId,
      tournamentId: tournamentId || undefined,
      sponsorName,
      companyName,
      phone,
      email,
      amountInvested: initialAmount,
      investmentDate: initialDate,
      contractType: contractType || 'general_grant',
      deliverablesAgreed,
      status: status || 'active',
      notes,
      transactions:
        initialAmount > 0
          ? [
              {
                type: 'investment',
                amount: initialAmount,
                date: initialDate,
                method: TX_METHODS.includes(paymentMethod) ? paymentMethod : 'cash',
                tournamentId: tournamentId || undefined,
                notes: 'Initial sponsorship investment',
              },
            ]
          : [],
    });

    sponsor.recalculateTotals();
    await sponsor.save();

    res.status(201).json({ success: true, sponsor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSponsor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const {
      amountInvested,
      returnsPaid,
      investmentDate,
      returnDate,
      transactions,
      tenantId,
      _id,
      ...profileUpdates
    } = req.body;

    // Sanitize tournamentId: empty string -> null
    if (profileUpdates.tournamentId === '' || profileUpdates.tournamentId === 'null') {
      profileUpdates.tournamentId = null;
    }

    // Fallback sponsorName to companyName if left blank
    if (!profileUpdates.sponsorName && profileUpdates.companyName) {
      profileUpdates.sponsorName = profileUpdates.companyName;
    }

    let sponsor = await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId });
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }

    if (sponsor.transactions.length === 0) {
      await ensureLedger(sponsor);
      sponsor = (await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId }))!;
    }

    // Apply profile updates
    sponsor.set(profileUpdates);

    // If amountInvested was updated via edit form, synchronize the primary investment in ledger
    if (req.body.amountInvested !== undefined && req.body.amountInvested !== '') {
      const newAmount = Number(req.body.amountInvested);
      if (!isNaN(newAmount) && newAmount >= 0) {
        const initialTx = sponsor.transactions.find((t: any) => t.type === 'investment');
        if (initialTx) {
          initialTx.amount = newAmount;
        } else if (newAmount > 0) {
          sponsor.transactions.push({
            type: 'investment',
            amount: newAmount,
            date: sponsor.investmentDate || new Date(),
            method: 'cash',
            tournamentId: sponsor.tournamentId,
            notes: 'Initial sponsorship investment',
          } as any);
        }
        sponsor.recalculateTotals();
      }
    }

    await sponsor.save();
    const populated = await populateSponsor(id, req.user?.tenantId);
    res.json({ success: true, sponsor: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSponsor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sponsor = await Sponsor.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }
    res.json({ success: true, message: 'Sponsor deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSponsorById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let sponsor = await populateSponsor(id, req.user?.tenantId);
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }
    if (sponsor.transactions.length === 0 && (await ensureLedger(sponsor))) {
      sponsor = await populateSponsor(id, req.user?.tenantId);
    }
    res.json({ success: true, sponsor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------------------------ */
/*                       Sponsor Ledger (Transactions)                 */
/* ------------------------------------------------------------------ */

const parseTxBody = (body: any) => {
  const { type, amount, date, method, reference, tournamentId, notes } = body;
  const errors: string[] = [];
  if (type !== undefined && !TX_TYPES.includes(type)) errors.push('Invalid transaction type');
  if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
    errors.push('Amount must be greater than 0');
  }
  if (method !== undefined && method !== '' && !TX_METHODS.includes(method)) errors.push('Invalid payment method');

  const data: any = {};
  if (type !== undefined) data.type = type;
  if (amount !== undefined) data.amount = Number(amount);
  if (date) data.date = new Date(date);
  if (method) data.method = method;
  if (reference !== undefined) data.reference = reference;
  if (tournamentId !== undefined) data.tournamentId = tournamentId || undefined;
  if (notes !== undefined) data.notes = notes;
  return { data, errors };
};

export const addSponsorTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, errors } = parseTxBody(req.body);
    if (!data.type || !data.amount) errors.push('Transaction type and amount are required');
    if (errors.length) {
      res.status(400).json({ success: false, message: errors.join(', ') });
      return;
    }

    let sponsor = await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId });
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }

    if (sponsor.transactions.length === 0) {
      await ensureLedger(sponsor);
      sponsor = (await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId }))!;
    }
    sponsor.transactions.push({ date: new Date(), method: 'cash', ...data });
    sponsor.recalculateTotals();
    await sponsor.save();

    const populated = await populateSponsor(id, req.user?.tenantId);
    res.status(201).json({ success: true, sponsor: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSponsorTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, txId } = req.params;
    const { data, errors } = parseTxBody(req.body);
    if (errors.length) {
      res.status(400).json({ success: false, message: errors.join(', ') });
      return;
    }

    let sponsor = await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId });
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }

    if (sponsor.transactions.length === 0) {
      await ensureLedger(sponsor);
      sponsor = (await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId }))!;
    }

    const tx = sponsor.transactions.id(String(txId));
    if (!tx) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    tx.set(data);
    sponsor.recalculateTotals();
    await sponsor.save();

    const populated = await populateSponsor(id, req.user?.tenantId);
    res.json({ success: true, sponsor: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSponsorTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, txId } = req.params;
    let sponsor = await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId });
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }

    if (sponsor.transactions.length === 0) {
      await ensureLedger(sponsor);
      sponsor = (await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId }))!;
    }

    const tx = sponsor.transactions.id(String(txId));
    if (!tx) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    tx.deleteOne();
    sponsor.recalculateTotals();
    await sponsor.save();

    const populated = await populateSponsor(id, req.user?.tenantId);
    res.json({ success: true, sponsor: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
