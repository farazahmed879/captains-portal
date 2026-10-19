import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { Tournament } from '../models/Tournament';

export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await Team.find({ tenantId: req.user?.tenantId }).sort({ createdAt: -1 });
    
    // Enrich with count of players, matches, and tournaments
    const enrichedTeams = await Promise.all(
      teams.map(async (team) => {
        const playerCount = await Player.countDocuments({ teamIds: team._id, isActive: true });
        const matchCount = await Match.countDocuments({ teamId: team._id });
        const tournamentCount = await Tournament.countDocuments({ teamId: team._id });
        return {
          ...team.toObject(),
          playerCount,
          matchCount,
          tournamentCount,
        };
      })
    );

    res.json({ success: true, teams: enrichedTeams });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, shortName, city, primaryColor, description } = req.body;
    if (!name || !shortName) {
      res.status(400).json({ success: false, message: 'Team name and short code are required' });
      return;
    }

    const team = await Team.create({
      tenantId: req.user?.tenantId,
      captainId: req.user?.id,
      name,
      shortName,
      city,
      primaryColor,
      description,
    });

    res.status(201).json({ success: true, team });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const team = await Team.findOneAndUpdate(
      { _id: id, tenantId: req.user?.tenantId },
      req.body,
      { new: true }
    );
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }
    res.json({ success: true, team });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeamById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const team = await Team.findOne({ _id: id, tenantId: req.user?.tenantId }).populate('captainId', 'name email phone');
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    const players = await Player.find({ teamIds: team._id, isActive: true }).sort({ name: 1 });
    const matches = await Match.find({ teamId: team._id }).populate('tournamentId', 'name format').sort({ matchDate: -1 });
    const tournaments = await Tournament.find({ teamId: team._id }).sort({ startDate: -1 });

    const totalMatches = matches.length;
    const matchesWon = matches.filter(m => m.result === 'won').length;
    const matchesLost = matches.filter(m => m.result === 'lost').length;
    const totalMatchExpenses = matches.reduce((sum, m) => sum + (m.totalMatchExpense || 0), 0);

    res.json({
      success: true,
      team,
      players,
      matches,
      tournaments,
      stats: {
        totalPlayers: players.length,
        totalMatches,
        matchesWon,
        matchesLost,
        winRate: totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0,
        totalMatchExpenses,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const team = await Team.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


