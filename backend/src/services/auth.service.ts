import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository, playerRepository } from '../repositories';
import { ApiError } from '../utils/apiError';
import { AUTH_CONSTANTS, MESSAGES, SYSTEM_DEFAULTS } from '../constants';
import { UserRole } from '../enums';
import { getJwtSecret } from '../config/jwt';

export class AuthService {
  private generateToken(user: { id: string; tenantId: string; email: string; role: string; name: string }): string {
    const secret = getJwtSecret();
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
    if (!password) {
      throw ApiError.badRequest('Password is required.');
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
          const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.SALT_ROUNDS);
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

    // Verify Password (always required)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized(MESSAGES.LOGIN_INCORRECT_PASSWORD);
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
          name: data.teamName || SYSTEM_DEFAULTS.CLUB_NAME,
          slug: (data.teamName || SYSTEM_DEFAULTS.CLUB_NAME).toLowerCase().replace(/\s+/g, '-'),
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
      // Self-registration always creates a captain; roles are granted by admins only.
      role: UserRole.CAPTAIN,
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

  /** Lets a signed-in user edit their own name, email and phone. Role and team are not editable here. */
  async updateMe(userId: string, data: { name?: string; email?: string; phone?: string }) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);

    const name = (data.name ?? user.name).trim();
    const email = (data.email ?? user.email).trim().toLowerCase();
    const phone = (data.phone ?? user.phone ?? '').trim();

    if (!name) throw ApiError.badRequest('Name is required.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw ApiError.badRequest('Please enter a valid email address.');
    }

    // Login matches email/phone across all accounts, so they must stay unique everywhere.
    if (email !== user.email.toLowerCase()) {
      const taken = await userRepository.findByIdentifier(email);
      if (taken && taken.id !== userId) throw ApiError.conflict(MESSAGES.EMAIL_ALREADY_EXISTS);
    }
    if (phone && phone !== (user.phone || '')) {
      const taken = await userRepository.findByIdentifier(phone);
      if (taken && taken.id !== userId) throw ApiError.conflict(MESSAGES.PHONE_ALREADY_EXISTS);
    }

    await userRepository.update(userId, { name, email, phone: phone || null });
    return this.getMe(userId);
  }

  /** Changes the signed-in user's password after confirming the current one. */
  async changePassword(userId: string, currentPassword?: string, newPassword?: string) {
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Current and new password are required.');
    }
    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters.');
    }
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    // 400, not 401: the client treats 401 as an expired session and signs the user out.
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect.');

    const password = await bcrypt.hash(newPassword, AUTH_CONSTANTS.SALT_ROUNDS);
    await userRepository.update(userId, { password });
    return { message: 'Password updated.' };
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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw ApiError.unauthorized(MESSAGES.LOGIN_INCORRECT_PASSWORD);
    }

    return { verified: true };
  }
}

export const authService = new AuthService();
