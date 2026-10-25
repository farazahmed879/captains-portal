import bcrypt from 'bcryptjs';
import { userRepository, playerRepository } from '../repositories';
import { ApiError } from '../utils/apiError';
import { AUTH_CONSTANTS, MESSAGES } from '../constants';
import { UserRole } from '../enums';

export class UserService {
  async getAllUsers(tenantId: string) {
    const rawUsers = await userRepository.findMany(tenantId);

    let superAdmins = 0;
    let captains = 0;
    let normalPlayers = 0;
    let treasurers = 0;

    const enrichedUsers = await Promise.all(
      rawUsers.map(async (u) => {
        if (u.role === UserRole.SUPER_ADMIN) superAdmins++;
        else if (u.role === UserRole.CAPTAIN) captains++;
        else if (u.role === UserRole.VIEWER) normalPlayers++;
        else if (u.role === UserRole.TREASURER) treasurers++;

        let player = null;
        if (u.playerId) {
          player = await playerRepository.findById(u.playerId);
        } else {
          player = await playerRepository.findByMatchingCriteria(tenantId, {
            phone: u.phone || undefined,
            email: u.email,
            name: u.name,
          });
        }

        const roleLabel =
          u.role === UserRole.SUPER_ADMIN
            ? 'Super Admin'
            : u.role === UserRole.CAPTAIN
            ? 'Team Captain'
            : u.role === UserRole.TREASURER
            ? 'Treasurer'
            : 'Normal Player';

        return {
          id: u.id,
          _id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          roleLabel,
          isCaptain: u.role === UserRole.CAPTAIN || u.role === UserRole.SUPER_ADMIN,
          isPlayer: u.role === UserRole.VIEWER || !!player,
          isActive: u.isActive,
          player: player
            ? {
                _id: player.id,
                name: player.name,
                jerseyNumber: player.jerseyNumber,
                role: player.role,
                battingStyle: player.battingStyle,
                bowlingStyle: player.bowlingStyle,
                phone: player.phone,
              }
            : null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      })
    );

    return {
      users: enrichedUsers,
      counts: {
        total: rawUsers.length,
        superAdmins,
        captains,
        normalPlayers,
        treasurers,
      },
    };
  }

  async updateUserRole(userId: string, tenantId: string, newRole: string) {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(newRole as UserRole)) {
      throw ApiError.badRequest(`Invalid role. Valid roles: ${validRoles.join(', ')}`);
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser || targetUser.tenantId !== tenantId) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // Safety: Prevent removing the last active super_admin
    if (targetUser.role === UserRole.SUPER_ADMIN && newRole !== UserRole.SUPER_ADMIN) {
      const activeAdminCount = await userRepository.countAdmins(tenantId);
      if (activeAdminCount <= 1) {
        throw ApiError.badRequest(MESSAGES.CANNOT_DEMOTE_LAST_ADMIN);
      }
    }

    const updated = await userRepository.updateRole(userId, newRole);
    return {
      user: updated,
      message: MESSAGES.USER_ROLE_UPDATED,
    };
  }

  async toggleUserStatus(userId: string, tenantId: string, currentUserId: string, isActive: boolean) {
    const targetUser = await userRepository.findById(userId);
    if (!targetUser || targetUser.tenantId !== tenantId) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    if (userId === currentUserId && !isActive) {
      throw ApiError.badRequest(MESSAGES.CANNOT_DELETE_SELF);
    }

    if (targetUser.role === UserRole.SUPER_ADMIN && !isActive) {
      const activeAdminCount = await userRepository.countAdmins(tenantId);
      if (activeAdminCount <= 1) {
        throw ApiError.badRequest(MESSAGES.CANNOT_DEACTIVATE_LAST_ADMIN);
      }
    }

    const updated = await userRepository.updateStatus(userId, isActive);
    return {
      user: updated,
      message: MESSAGES.USER_STATUS_UPDATED,
    };
  }

  async createUser(
    tenantId: string,
    data: { name: string; email?: string; phone?: string; password?: string; role?: string }
  ) {
    if (!data.name || !data.name.trim()) {
      throw ApiError.badRequest('Name is required');
    }

    let finalEmail = data.email ? data.email.toLowerCase().trim() : '';
    if (!finalEmail) {
      const cleanPhone = (data.phone || 'user').replace(/[\s\-()+]/g, '');
      finalEmail = `user_${cleanPhone}_${Date.now()}@captainsportal.local`;
    }

    const existingEmail = await userRepository.findByEmail(tenantId, finalEmail);
    if (existingEmail) {
      throw ApiError.conflict(MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    if (data.phone) {
      const existingPhone = await userRepository.findByPhone(tenantId, data.phone.trim());
      if (existingPhone) {
        throw ApiError.conflict(MESSAGES.PHONE_ALREADY_EXISTS);
      }
    }

    // Auto-link player if exists
    const matchingPlayer = await playerRepository.findByMatchingCriteria(tenantId, {
      name: data.name.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
    });

    const hashedPassword = await bcrypt.hash(
      data.password || AUTH_CONSTANTS.DEFAULT_PASSWORD,
      AUTH_CONSTANTS.SALT_ROUNDS
    );

    const user = await userRepository.create({
      tenantId,
      name: data.name.trim(),
      email: finalEmail,
      phone: data.phone ? data.phone.trim() : undefined,
      password: hashedPassword,
      playerId: matchingPlayer?.id,
      role: data.role || UserRole.CAPTAIN,
      isActive: true,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
      message: MESSAGES.USER_CREATED,
    };
  }

  async deleteUser(userId: string, tenantId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw ApiError.badRequest(MESSAGES.CANNOT_DELETE_SELF);
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser || targetUser.tenantId !== tenantId) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      const activeAdminCount = await userRepository.countAdmins(tenantId);
      if (activeAdminCount <= 1) {
        throw ApiError.badRequest(MESSAGES.CANNOT_DEMOTE_LAST_ADMIN);
      }
    }

    await userRepository.delete(userId);
    return {
      message: MESSAGES.USER_DELETED,
    };
  }
}

export const userService = new UserService();
