import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Sponsor } from '../models/Sponsor';

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
      contractType,
      returnsPaid,
      returnDate,
      deliverablesAgreed,
      status,
      notes,
    } = req.body;

    if (!teamId || !sponsorName || amountInvested === undefined) {
      res.status(400).json({ success: false, message: 'Team, sponsor name, and amount invested are required' });
      return;
    }

    const sponsor = await Sponsor.create({
      tenantId: req.user?.tenantId,
      teamId,
      tournamentId: tournamentId || undefined,
      sponsorName,
      companyName,
      phone,
      email,
      amountInvested: Number(amountInvested),
      investmentDate: investmentDate || new Date(),
      contractType: contractType || 'general_grant',
      returnsPaid: Number(returnsPaid) || 0,
      returnDate: returnDate || undefined,
      deliverablesAgreed,
      status: status || 'active',
      notes,
    });

    res.status(201).json({ success: true, sponsor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSponsor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sponsor = await Sponsor.findOneAndUpdate(
      { _id: id, tenantId: req.user?.tenantId },
      req.body,
      { new: true }
    );
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }
    res.json({ success: true, sponsor });
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
    const sponsor = await Sponsor.findOne({ _id: id, tenantId: req.user?.tenantId })
      .populate('teamId', 'name shortName primaryColor')
      .populate('tournamentId', 'name format venue');
    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }
    res.json({ success: true, sponsor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

