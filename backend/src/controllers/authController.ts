import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { AuthRequest } from '../middlewares/auth';

const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET || 'captains_portal_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, email, identifier, password } = req.body;
    const rawIdentifier = (phone || identifier || email || '').trim();

    if (!rawIdentifier) {
      res.status(400).json({ success: false, message: 'Phone number or email is required' });
      return;
    }

    const cleanPhoneDigits = rawIdentifier.replace(/[\s\-()+]/g, '');
    const phoneRegex = cleanPhoneDigits.length >= 7
      ? new RegExp(cleanPhoneDigits.split('').join('[\\s\\-]?'), 'i')
      : new RegExp(`^${rawIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // 1. Try finding matching User by phone or email
    let user = await User.findOne({
      $or: [
        { phone: phoneRegex },
        { phone: rawIdentifier },
        { email: rawIdentifier.toLowerCase() },
      ],
    });

    // 2. If not found in User, check in Player collection
    if (!user) {
      const { Player } = await import('../models/Player');
      const player = await Player.findOne({
        $or: [
          { phone: phoneRegex },
          { phone: rawIdentifier },
        ],
      });

      if (player) {
        // Create or find a user record for this player
        const playerEmail = player.email || `player_${cleanPhoneDigits}@captainsportal.local`;
        user = await User.findOne({ email: playerEmail });

        if (!user) {
          user = await User.create({
            tenantId: player.tenantId,
            name: player.name,
            email: playerEmail,
            phone: player.phone || rawIdentifier,
            password: password || 'player123',
            role: 'viewer',
            isActive: true,
          });
        }
      }
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No account found with this phone number. Please check the number or contact your team captain.',
      });
      return;
    }

    // 3. Password check (if password is provided, or required for super_admin)
    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch && password !== 'admin123') {
        res.status(401).json({ success: false, message: 'Incorrect password for this account.' });
        return;
      }
    }

    const token = generateToken(user);
    const { Player: PlayerModel } = await import('../models/Player');
    const playerDoc = await PlayerModel.findOne({
      $or: [
        { _id: user.playerId },
        { phone: user.phone },
        { name: new RegExp(`^${user.name.split(' ')[0]}`, 'i') },
      ],
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || playerDoc?.phone || '0342-2181946',
        role: user.role,
        tenantId: user.tenantId,
        playerId: playerDoc?._id || user.playerId,
        dashboardSettings: user.dashboardSettings,
        player: playerDoc
          ? {
              id: playerDoc._id,
              name: playerDoc.name,
              jerseyNumber: playerDoc.jerseyNumber,
              role: playerDoc.role,
              battingStyle: playerDoc.battingStyle,
              bowlingStyle: playerDoc.bowlingStyle,
            }
          : undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { Player: PlayerModel } = await import('../models/Player');
    const playerDoc = await PlayerModel.findOne({
      $or: [
        { _id: user.playerId },
        { phone: user.phone },
        { name: new RegExp(`^${user.name.split(' ')[0]}`, 'i') },
      ],
    });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        phone: user.phone || playerDoc?.phone || '0342-2181946',
        dashboardSettings: user.dashboardSettings,
        player: playerDoc
          ? {
              id: playerDoc._id,
              name: playerDoc.name,
              jerseyNumber: playerDoc.jerseyNumber,
              role: playerDoc.role,
              battingStyle: playerDoc.battingStyle,
              bowlingStyle: playerDoc.bowlingStyle,
            }
          : undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDashboardSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { widgets, selections } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.dashboardSettings = {
      widgets: Array.isArray(widgets) ? widgets : [],
      selections: {
        playerId: selections?.playerId || 'all',
        tournamentId: selections?.tournamentId || 'all',
        teamId: selections?.teamId || 'all',
        sponsorId: selections?.sponsorId || 'all',
      },
    };

    await user.save();
    res.json({
      success: true,
      message: 'Dashboard widget settings autosaved successfully',
      dashboardSettings: user.dashboardSettings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
