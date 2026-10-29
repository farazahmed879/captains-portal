import {
  playerRepository,
  paymentRepository,
  playerReturnRepository,
  teamRepository,
} from '../repositories';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';
import { MESSAGES } from '../constants';

export class PlayerService {
  async getPlayers(tenantId: string, teamIdQuery?: string) {
    let filter: any = {};
    if (teamIdQuery) {
      filter.teamIds = { has: teamIdQuery };
    }

    const rawPlayers = await playerRepository.findMany(tenantId, filter);

    const enriched = await Promise.all(
      rawPlayers.map(async (p) => {
        const payments = await paymentRepository.findByPlayer(tenantId, p.id);
        const returns = await playerReturnRepository.findByPlayer(tenantId, p.id);

        const totalFeeAssigned = payments.reduce((acc, pay) => acc + (pay.feeAssigned || 0), 0);
        const totalFeePaid = payments.reduce((acc, pay) => acc + (pay.feePaid || 0), 0);
        const totalReturned = returns.reduce((acc, ret) => acc + (ret.amount || 0), 0);
        const pendingDue = Math.max(0, totalFeeAssigned - totalFeePaid);
        const advanceCredit = Math.max(0, totalFeePaid - totalFeeAssigned);

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

    return {
      player: {
        ...player,
        _id: player.id,
      },
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

  async createPlayer(tenantId: string, data: any) {
    if (!data.name || !data.name.trim()) {
      throw ApiError.badRequest('Player name is required');
    }

    const player = await playerRepository.create({
      tenantId,
      ...data,
      name: data.name.trim(),
    });

    return {
      ...player,
      _id: player.id,
    };
  }

  async updatePlayer(id: string, tenantId: string, data: any) {
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
