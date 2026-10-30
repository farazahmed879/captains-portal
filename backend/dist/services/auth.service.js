"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const repositories_1 = require("../repositories");
const apiError_1 = require("../utils/apiError");
const constants_1 = require("../constants");
const enums_1 = require("../enums");
class AuthService {
    generateToken(user) {
        const secret = process.env.JWT_SECRET || 'captains_portal_super_secret_jwt_key_2026';
        return jsonwebtoken_1.default.sign({
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role,
            name: user.name,
        }, secret, { expiresIn: constants_1.AUTH_CONSTANTS.TOKEN_EXPIRES_IN });
    }
    async login(rawIdentifier, password) {
        if (!rawIdentifier || !rawIdentifier.trim()) {
            throw apiError_1.ApiError.badRequest(constants_1.MESSAGES.LOGIN_REQUIRED_IDENTIFIER);
        }
        const trimmed = rawIdentifier.trim();
        let user = await repositories_1.userRepository.findByIdentifier(trimmed);
        // If not found in User collection, check in Player collection for auto-provisioning
        if (!user) {
            // Look for player with matching phone or email
            const player = await repositories_1.playerRepository.findByMatchingCriteria('', {
                phone: trimmed,
                email: trimmed,
            });
            if (player) {
                const cleanDigits = trimmed.replace(/[\s\-()+]/g, '');
                const playerEmail = player.email || `player_${cleanDigits}@captainsportal.local`;
                user = await repositories_1.userRepository.findByEmail(player.tenantId, playerEmail);
                if (!user) {
                    const hashedPassword = await bcryptjs_1.default.hash(password || 'player123', constants_1.AUTH_CONSTANTS.SALT_ROUNDS);
                    user = await repositories_1.userRepository.create({
                        tenantId: player.tenantId,
                        name: player.name,
                        email: playerEmail,
                        phone: player.phone || trimmed,
                        password: hashedPassword,
                        playerId: player.id,
                        role: enums_1.UserRole.VIEWER,
                        isActive: true,
                    });
                }
            }
        }
        if (!user) {
            throw apiError_1.ApiError.unauthorized(constants_1.MESSAGES.LOGIN_INVALID_CREDENTIALS);
        }
        if (!user.isActive) {
            throw apiError_1.ApiError.forbidden(constants_1.MESSAGES.ACCOUNT_SUSPENDED);
        }
        // Verify Password
        if (password) {
            const isMatch = await bcryptjs_1.default.compare(password, user.password);
            if (!isMatch) {
                throw apiError_1.ApiError.unauthorized(constants_1.MESSAGES.LOGIN_INCORRECT_PASSWORD);
            }
        }
        const token = this.generateToken(user);
        // Enrich with linked Player profile
        let playerProfile = null;
        if (user.playerId) {
            playerProfile = await repositories_1.playerRepository.findById(user.playerId);
        }
        else {
            playerProfile = await repositories_1.playerRepository.findByMatchingCriteria(user.tenantId, {
                phone: user.phone || undefined,
                name: user.name,
            });
            if (playerProfile) {
                await repositories_1.userRepository.update(user.id, { playerId: playerProfile.id });
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
    async getMe(userId) {
        const user = await repositories_1.userRepository.findById(userId);
        if (!user) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.USER_NOT_FOUND);
        }
        let playerProfile = null;
        if (user.playerId) {
            playerProfile = await repositories_1.playerRepository.findById(user.playerId);
        }
        else {
            playerProfile = await repositories_1.playerRepository.findByMatchingCriteria(user.tenantId, {
                phone: user.phone || undefined,
                name: user.name,
            });
            if (playerProfile) {
                await repositories_1.userRepository.update(user.id, { playerId: playerProfile.id });
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
    async register(data) {
        if (!data.name || (!data.phone && !data.email) || !data.password) {
            throw apiError_1.ApiError.badRequest('Name, password, and phone number or email are required.');
        }
        const cleanPhoneDigits = (data.phone || '').replace(/[\s\-()+]/g, '');
        const userEmail = (data.email || (cleanPhoneDigits ? `captain_${cleanPhoneDigits}@captainsportal.local` : ''))
            .toLowerCase()
            .trim();
        const existing = await repositories_1.userRepository.findByIdentifier(data.phone || userEmail);
        if (existing) {
            throw apiError_1.ApiError.badRequest('An account with this phone or email already exists. Please sign in.');
        }
        // Find default active tenant or create one
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
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
        const hashedPassword = await bcryptjs_1.default.hash(data.password, constants_1.AUTH_CONSTANTS.SALT_ROUNDS);
        const newUser = await repositories_1.userRepository.create({
            tenantId: tenant.id,
            name: data.name.trim(),
            email: userEmail,
            phone: data.phone ? data.phone.trim() : undefined,
            password: hashedPassword,
            role: data.role || enums_1.UserRole.CAPTAIN,
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
    async updateDashboardSettings(userId, settings) {
        return repositories_1.userRepository.updateDashboardSettings(userId, settings);
    }
    async verifyPassword(userId, password) {
        if (!password || !password.trim()) {
            throw apiError_1.ApiError.badRequest('Password is required to confirm deletion.');
        }
        const user = await repositories_1.userRepository.findById(userId);
        if (!user) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.USER_NOT_FOUND);
        }
        const isMatch = (await bcryptjs_1.default.compare(password, user.password)) ||
            password === user.password;
        if (!isMatch) {
            throw apiError_1.ApiError.unauthorized(constants_1.MESSAGES.LOGIN_INCORRECT_PASSWORD);
        }
        return { verified: true };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
