import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository, playerRepository } from '../repositories';
import { ApiError } from '../utils/apiError';
import { AUTH_CONSTANTS, MESSAGES } from '../constants';
import { UserRole } from '../enums';

export class AuthService {
  private generateToken(user: { id: string; tenantId: string; email: string; role: string; name: string }): string {
    const secret = process.env.JWT_SECRET || 'captains_portal_super_secret_jwt_key_2026';
    return jwt.sign(
      {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      secret,
      { expiresIn: AUTH_CONSTANTS.TOKEN_EXPIRES_IN }
    );
  }

  async login(rawIdentifier: string, password?: string) {
    if (!rawIdentifier || !rawIdentifier.trim()) {
      throw ApiError.badRequest(MESSAGES.LOGIN_REQUIRED_IDENTIFIER);
    }

    const trimmed = rawIdentifier.trim();
    let user = await userRepository.findByIdentifier(trimmed);

    // If not found in User collection, check in Player collection for auto-provisioning
    if (!user) {
      // Look for player with matching phone or email
      const player = await playerRepository.findByMatchingCriteria('', {
        phone: trimmed,
        email: trimmed,
      });

      if (player) {
        const cleanDigits = trimmed.replace(/[\s\-()+]/g, '');
        const playerEmail = player.email || `player_${cleanDigits}@captainsportal.local`;
        user = await userRepository.findByEmail(player.tenantId, playerEmail);

        if (!user) {
          const hashedPassword = await bcrypt.hash(password || 'player123', AUTH_CONSTANTS.SALT_ROUNDS);
          user = await userRepository.create({
            tenantId: player.tenantId,
            name: player.name,
            email: playerEmail,
            phone: player.phone || trimmed,
            password: hashedPassword,
            playerId: player.id,
            role: UserRole.VIEWER,
            isActive: true,
          });
        }
      }
    }

    if (!user) {
      throw ApiError.unauthorized(MESSAGES.LOGIN_INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw ApiError.forbidden(MESSAGES.ACCOUNT_SUSPENDED);
    }

    // Verify Password
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw ApiError.unauthorized(MESSAGES.LOGIN_INCORRECT_PASSWORD);
      }
    }

    const token = this.generateToken(user);

    // Enrich with linked Player profile
    let playerProfile = null;
    if (user.playerId) {
      playerProfile = await playerRepository.findById(user.playerId);
    } else {
      playerProfile = await playerRepository.findByMatchingCriteria(user.tenantId, {
        phone: user.phone || undefined,
        name: user.name,
      });
      if (playerProfile) {
        await userRepository.update(user.id, { playerId: playerProfile.id });
      }
    }

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || playerProfile?.phone,
        role: user.role,
        tenantId: user.tenantId,
        playerId: user.playerId || playerProfile?.id,
        dashboardSettings: user.dashboardSettings,
        player: playerProfile
          ? {
              id: playerProfile.id,
              name: playerProfile.name,
              jerseyNumber: playerProfile.jerseyNumber,
              role: playerProfile.role,
              battingStyle: playerProfile.battingStyle,
              bowlingStyle: playerProfile.bowlingStyle,
            }
          : undefined,
      },
    };
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    let playerProfile = null;
    if (user.playerId) {
      playerProfile = await playerRepository.findById(user.playerId);
    } else {
      playerProfile = await playerRepository.findByMatchingCriteria(user.tenantId, {
        phone: user.phone || undefined,
        name: user.name,
      });
      if (playerProfile) {
        await userRepository.update(user.id, { playerId: playerProfile.id });
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || playerProfile?.phone,
      role: user.role,
      tenantId: user.tenantId,
      playerId: user.playerId || playerProfile?.id,
      dashboardSettings: user.dashboardSettings,
      player: playerProfile
        ? {
            id: playerProfile.id,
            name: playerProfile.name,
            jerseyNumber: playerProfile.jerseyNumber,
            role: playerProfile.role,
            battingStyle: playerProfile.battingStyle,
            bowlingStyle: playerProfile.bowlingStyle,
            teamIds: playerProfile.teamIds,
          }
        : undefined,
    };
  }

  async register(data: {
    name: string;
    phone?: string;
    email?: string;
    password: string;
    teamName?: string;
    role?: string;
  }) {
    if (!data.name || (!data.phone && !data.email) || !data.password) {
      throw ApiError.badRequest('Name, password, and phone number or email are required.');
    }

    const cleanPhoneDigits = (data.phone || '').replace(/[\s\-()+]/g, '');
    const userEmail = (
      data.email || (cleanPhoneDigits ? `captain_${cleanPhoneDigits}@captainsportal.local` : '')
    )
      .toLowerCase()
      .trim();

    const existing = await userRepository.findByIdentifier(data.phone || userEmail);
    if (existing) {
      throw ApiError.badRequest('An account with this phone or email already exists. Please sign in.');
    }

    // Find default active tenant or create one
    const { prisma } = await import('../config/prisma');
    let tenant = await prisma.tenant.findFirst({ where: { isActive: true } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: data.teamName || 'Gulzar Cricket Club',
          slug: (data.teamName || 'gulzar-cricket-club').toLowerCase().replace(/\s+/g, '-'),
          isActive: true,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, AUTH_CONSTANTS.SALT_ROUNDS);

    const newUser = await userRepository.create({
      tenantId: tenant.id,
      name: data.name.trim(),
      email: userEmail,
      phone: data.phone ? data.phone.trim() : undefined,
      password: hashedPassword,
      role: data.role || UserRole.CAPTAIN,
      isActive: true,
    });

    const token = this.generateToken(newUser);

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        tenantId: newUser.tenantId,
      },
    };
  }

  async updateDashboardSettings(userId: string, settings: any) {
    return userRepository.updateDashboardSettings(userId, settings);
  }

  async verifyPassword(userId: string, password?: string) {
    if (!password || !password.trim()) {
      throw ApiError.badRequest('Password is required to confirm deletion.');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    const isMatch =
      (await bcrypt.compare(password, user.password)) ||
      password === user.password;

    if (!isMatch) {
      throw ApiError.unauthorized(MESSAGES.LOGIN_INCORRECT_PASSWORD);
    }

    return { verified: true };
  }
}

export const authService = new AuthService();
