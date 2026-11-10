import {
  playerRepository,
  paymentRepository,
  playerReturnRepository,
  teamRepository,
} from '../repositories';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';
import { MESSAGES } from '../constants';
import { stripProtectedFields } from '../utils/tenantGuard';
import { MatchPayment as MatchPaymentModel } from '../models/MatchPayment';
import { Match as MatchModel } from '../models/Match';
import { PlayerReturn as PlayerReturnModel } from '../models/PlayerReturn';
import '../models/Tournament'; // registers the model used by populate()

/** Rejects team ids that don't belong to the caller's tenant. */
const assertTeamsInTenant = async (tenantId: string, teamIds: unknown) => {
  if (teamIds === undefined || teamIds === null) return;
  if (!Array.isArray(teamIds)) throw ApiError.badRequest('teamIds must be an array');
  for (const teamId of teamIds) {
    const team = await teamRepository.findById(String(teamId), tenantId).catch(() => null);
    if (!team) throw ApiError.badRequest('Team not found');
  }
};

export class PlayerService {
  async getPlayers(tenantId: string, teamIdQuery?: string) {
    let filter: any = {};
    if (teamIdQuery) {
      filter.teamIds = { has: teamIdQuery };
    }

    const rawPlayers = await playerRepository.findMany(tenantId, filter);

    // matchId -> tournamentId, so each player's tournament count needs no extra queries.
    const tenantMatches = await prisma.match.findMany({
      where: { tenantId },
      select: { id: true, tournamentId: true },
    });
    const tournamentByMatch = new Map(tenantMatches.map((m) => [m.id, m.tournamentId]));

    const enriched = await Promise.all(
      rawPlayers.map(async (p) => {
        const payments = await paymentRepository.findByPlayer(tenantId, p.id);
        const returns = await playerReturnRepository.findByPlayer(tenantId, p.id);

        const totalFeeAssigned = payments.reduce((acc, pay) => acc + (pay.feeAssigned || 0), 0);
        const totalFeePaid = payments.reduce((acc, pay) => acc + (pay.feePaid || 0), 0);
        const totalReturned = returns.reduce((acc, ret) => acc + (ret.amount || 0), 0);
        const pendingDue = Math.max(0, totalFeeAssigned - totalFeePaid);
        const advanceCredit = Math.max(0, totalFeePaid - totalFeeAssigned);
        const tournamentsCount = new Set(
          payments.map((pay) => tournamentByMatch.get(pay.matchId)).filter(Boolean)
        ).size;

        const teams = await Promise.all(
          p.teamIds.map(async (tId) => {
            const team = await teamRepository.findById(tId, tenantId);
            return team
              ? {
                  _id: team.id,
                  id: team.id,
                  name: team.name,
                  shortName: team.shortName,
                  primaryColor: team.primaryColor,
                }
              : null;
          })
        );

        const lastPayment = payments[0];
        const lastMatchDate = lastPayment
          ? lastPayment.paymentDate || lastPayment.createdAt || null
          : null;

        return {
          ...p,
          _id: p.id,
          teamIds: teams.filter(Boolean),
          matchesPlayed: payments.length,
          tournamentsCount,
          lastMatchDate,
          totalFeeAssigned,
          totalFeePaid,
          totalReturned,
          pendingDue,
          advanceCredit,
        };
      })
    );

    return enriched;
  }

  async getPlayerById(id: string, tenantId: string) {
    const player = await playerRepository.findById(id, tenantId);
    if (!player) {
      throw ApiError.notFound(MESSAGES.PLAYER_NOT_FOUND);
    }

    const payments = await paymentRepository.findByPlayer(tenantId, id);
    const returns = await playerReturnRepository.findByPlayer(tenantId, id);

    const totalFeeAssigned = payments.reduce((acc, pay) => acc + (pay.feeAssigned || 0), 0);
    const totalFeePaid = payments.reduce((acc, pay) => acc + (pay.feePaid || 0), 0);
    const totalReturned = returns.reduce((acc, ret) => acc + (ret.amount || 0), 0);
    const pendingDue = Math.max(0, totalFeeAssigned - totalFeePaid);

    // The profile page and the Pay Fee dialog render from `ledger`: payment rows with their
    // match (and the match's tournament) populated, MOM awards, and refunds with tournament names.
    const [matchHistory, momMatches, populatedReturns] = await Promise.all([
      MatchPaymentModel.find({ tenantId, playerId: id })
        .populate({
          path: 'matchId',
          select: 'opponentTeam matchDate tournamentStage matchType tournamentId teamId venue overs result',
          populate: { path: 'tournamentId', select: 'name format startDate' },
        })
        .sort({ createdAt: -1 })
        .lean(),
      MatchModel.find({ tenantId, momPlayerId: id })
        .select('opponentTeam matchDate momPrizeMoney momAwardDetails')
        .lean(),
      PlayerReturnModel.find({ tenantId, playerId: id })
        .populate('tournamentId', 'name')
        .sort({ returnDate: -1 })
        .lean(),
    ]);

    const tournamentIds = new Set(
      matchHistory
        .map((rec: any) => rec.matchId?.tournamentId?._id?.toString())
        .filter(Boolean)
    );

    const ledger = {
      matchHistory,
      momAwards: momMatches.map((m: any) => ({
        matchId: { _id: m._id, opponentTeam: m.opponentTeam, matchDate: m.matchDate },
        momPrizeMoney: m.momPrizeMoney || 0,
        momAwardDetails: m.momAwardDetails,
      })),
      returns: populatedReturns,
      totalFeeAssigned,
      totalFeePaid,
      totalReturned,
      pendingDue,
      advanceCredit: Math.max(0, totalFeePaid - totalFeeAssigned),
      matchesPlayed: matchHistory.length,
      tournamentsCount: tournamentIds.size,
    };

    return {
      player: {
        ...player,
        _id: player.id,
      },
      ledger,
      payments: payments.map((p) => ({ ...p, _id: p.id })),
      returns: returns.map((r) => ({ ...r, _id: r.id })),
      stats: {
        totalFeeAssigned,
        totalFeePaid,
        totalReturned,
        pendingDue: Math.max(0, totalFeeAssigned - totalFeePaid),
        advanceCredit: Math.max(0, totalFeePaid - totalFeeAssigned),
      },
    };
  }

  async createPlayer(tenantId: string, rawData: any) {
    const data = stripProtectedFields(rawData);
    if (!data.name || !data.name.trim()) {
      throw ApiError.badRequest('Player name is required');
    }
    await assertTeamsInTenant(tenantId, data.teamIds);

    const player = await playerRepository.create({
      ...data,
      tenantId,
      name: data.name.trim(),
    });

    return {
      ...player,
      _id: player.id,
    };
  }

  async updatePlayer(id: string, tenantId: string, rawData: any) {
    const data = stripProtectedFields(rawData);
    await assertTeamsInTenant(tenantId, data.teamIds);
    const updated = await playerRepository.update(id, tenantId, data);
    if (!updated) {
      throw ApiError.notFound(MESSAGES.PLAYER_NOT_FOUND);
    }
    return {
      ...updated,
      _id: updated.id,
    };
  }

  async deletePlayer(id: string, tenantId: string) {
    const deleted = await playerRepository.delete(id, tenantId);
    if (!deleted) {
      throw ApiError.notFound(MESSAGES.PLAYER_NOT_FOUND);
    }

    // Cascade delete player's payment and return records so ledger stats stay clean
    await Promise.all([
      prisma.matchPayment.deleteMany({ where: { tenantId, playerId: id } }),
      prisma.playerReturn.deleteMany({ where: { tenantId, playerId: id } }),
    ]);

    return {
      message: MESSAGES.PLAYER_DELETED,
    };
  }
}

export const playerService = new PlayerService();
