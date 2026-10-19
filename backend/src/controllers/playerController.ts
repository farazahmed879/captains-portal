import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Player } from '../models/Player';
import { MatchPayment } from '../models/MatchPayment';
import { Match } from '../models/Match';

export const getPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, search, role } = req.query;
    const filter: any = { tenantId: req.user?.tenantId, isActive: true };

    if (teamId) {
      filter.teamIds = teamId;
    }
    if (role) {
      filter.role = role;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const players = await Player.find(filter).populate('teamIds', 'name shortName primaryColor').sort({ name: 1 });

    // Aggregate financial ledger for each player
    const playerSummaries = await Promise.all(
      players.map(async (player) => {
        const payments = await MatchPayment.find({ playerId: player._id });
        const totalFeeAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
        const totalFeePaid = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
        const pendingDue = totalFeeAssigned - totalFeePaid;
        const matchesPlayed = payments.length;

        // Count MOM awards
        const momCount = await Match.countDocuments({ momPlayerId: player._id });

        return {
          ...player.toObject(),
          matchesPlayed,
          totalFeeAssigned,
          totalFeePaid,
          pendingDue,
          momCount,
        };
      })
    );

    res.json({ success: true, players: playerSummaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlayerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const player = await Player.findOne({ _id: id, tenantId: req.user?.tenantId }).populate('teamIds');
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }

    const payments = await MatchPayment.find({ playerId: player._id })
      .populate('matchId', 'opponentTeam matchDate matchType result venue overs')
      .sort({ createdAt: -1 });

    const totalFeeAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
    const totalFeePaid = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
    const momMatches = await Match.find({ momPlayerId: player._id });

    res.json({
      success: true,
      player,
      ledger: {
        totalFeeAssigned,
        totalFeePaid,
        pendingDue: totalFeeAssigned - totalFeePaid,
        matchHistory: payments,
        momAwards: momMatches,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, email, role, battingStyle, bowlingStyle, jerseyNumber, teamIds, notes } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Player name is required' });
      return;
    }

    const player = await Player.create({
      tenantId: req.user?.tenantId,
      name,
      phone,
      email,
      role: role || 'all_rounder',
      battingStyle: battingStyle || 'right_hand',
      bowlingStyle: bowlingStyle || 'right_arm_medium',
      jerseyNumber,
      teamIds: teamIds || [],
      notes,
    });

    res.status(201).json({ success: true, player });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const player = await Player.findOneAndUpdate(
      { _id: id, tenantId: req.user?.tenantId },
      req.body,
      { new: true }
    );
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    res.json({ success: true, player });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const player = await Player.findOneAndUpdate(
      { _id: id, tenantId: req.user?.tenantId },
      { isActive: false },
      { new: true }
    );
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    res.json({ success: true, message: 'Player deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
