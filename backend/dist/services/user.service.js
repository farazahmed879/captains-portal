"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const repositories_1 = require("../repositories");
const apiError_1 = require("../utils/apiError");
const constants_1 = require("../constants");
const enums_1 = require("../enums");
class UserService {
    async getAllUsers(tenantId) {
        const rawUsers = await repositories_1.userRepository.findMany(tenantId);
        let superAdmins = 0;
        let admins = 0;
        let captains = 0;
        let normalPlayers = 0;
        let treasurers = 0;
        const enrichedUsers = await Promise.all(rawUsers.map(async (u) => {
            if (u.role === enums_1.UserRole.SUPER_ADMIN)
                superAdmins++;
            else if (u.role === enums_1.UserRole.ADMIN)
                admins++;
            else if (u.role === enums_1.UserRole.CAPTAIN)
                captains++;
            else if (u.role === enums_1.UserRole.VIEWER)
                normalPlayers++;
            else if (u.role === enums_1.UserRole.TREASURER)
                treasurers++;
            let player = null;
            if (u.playerId) {
                player = await repositories_1.playerRepository.findById(u.playerId);
            }
            else {
                player = await repositories_1.playerRepository.findByMatchingCriteria(tenantId, {
                    phone: u.phone || undefined,
                    email: u.email,
                    name: u.name,
                });
            }
            const roleLabel = u.role === enums_1.UserRole.SUPER_ADMIN
                ? 'Super Admin'
                : u.role === enums_1.UserRole.ADMIN
                    ? 'Admin'
                    : u.role === enums_1.UserRole.CAPTAIN
                        ? 'Team Captain'
                        : u.role === enums_1.UserRole.TREASURER
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
                isCaptain: u.role === enums_1.UserRole.CAPTAIN || u.role === enums_1.UserRole.SUPER_ADMIN || u.role === enums_1.UserRole.ADMIN,
                isPlayer: u.role === enums_1.UserRole.VIEWER || !!player,
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
        }));
        return {
            users: enrichedUsers,
            counts: {
                total: rawUsers.length,
                superAdmins,
                admins,
                captains,
                normalPlayers,
                treasurers,
            },
        };
    }
    async updateUserRole(userId, tenantId, newRole) {
        const validRoles = Object.values(enums_1.UserRole);
        if (!validRoles.includes(newRole)) {
            throw apiError_1.ApiError.badRequest(`Invalid role. Valid roles: ${validRoles.join(', ')}`);
        }
        const targetUser = await repositories_1.userRepository.findById(userId);
        if (!targetUser || targetUser.tenantId !== tenantId) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.USER_NOT_FOUND);
        }
        // Safety: Super Admin accounts cannot have their role changed
        if (targetUser.role === enums_1.UserRole.SUPER_ADMIN) {
            throw apiError_1.ApiError.badRequest('Super Admin role is locked and cannot be changed.');
        }
        const updated = await repositories_1.userRepository.updateRole(userId, newRole);
        return {
            user: updated,
            message: constants_1.MESSAGES.USER_ROLE_UPDATED,
        };
    }
    async toggleUserStatus(userId, tenantId, currentUserId, isActive) {
        const targetUser = await repositories_1.userRepository.findById(userId);
        if (!targetUser || targetUser.tenantId !== tenantId) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.USER_NOT_FOUND);
        }
        if (userId === currentUserId && !isActive) {
            throw apiError_1.ApiError.badRequest(constants_1.MESSAGES.CANNOT_DELETE_SELF);
        }
        if (targetUser.role === enums_1.UserRole.SUPER_ADMIN && !isActive) {
            throw apiError_1.ApiError.badRequest('Super Admin accounts are protected and cannot be deactivated.');
        }
        const updated = await repositories_1.userRepository.updateStatus(userId, isActive);
        return {
            user: updated,
            message: constants_1.MESSAGES.USER_STATUS_UPDATED,
        };
    }
    async createUser(tenantId, data) {
        if (!data.name || !data.name.trim()) {
            throw apiError_1.ApiError.badRequest('Name is required');
        }
        let finalEmail = data.email ? data.email.toLowerCase().trim() : '';
        if (!finalEmail) {
            const cleanPhone = (data.phone || 'user').replace(/[\s\-()+]/g, '');
            finalEmail = `user_${cleanPhone}_${Date.now()}@captainsportal.local`;
        }
        const existingEmail = await repositories_1.userRepository.findByEmail(tenantId, finalEmail);
        if (existingEmail) {
            throw apiError_1.ApiError.conflict(constants_1.MESSAGES.EMAIL_ALREADY_EXISTS);
        }
        if (data.phone) {
            const existingPhone = await repositories_1.userRepository.findByPhone(tenantId, data.phone.trim());
            if (existingPhone) {
                throw apiError_1.ApiError.conflict(constants_1.MESSAGES.PHONE_ALREADY_EXISTS);
            }
        }
        // Auto-link player if exists
        const matchingPlayer = await repositories_1.playerRepository.findByMatchingCriteria(tenantId, {
            name: data.name.trim(),
            phone: data.phone?.trim(),
            email: data.email?.trim(),
        });
        const hashedPassword = await bcryptjs_1.default.hash(data.password || constants_1.AUTH_CONSTANTS.DEFAULT_PASSWORD, constants_1.AUTH_CONSTANTS.SALT_ROUNDS);
        const user = await repositories_1.userRepository.create({
            tenantId,
            name: data.name.trim(),
            email: finalEmail,
            phone: data.phone ? data.phone.trim() : undefined,
            password: hashedPassword,
            playerId: matchingPlayer?.id,
            role: data.role || enums_1.UserRole.CAPTAIN,
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
            message: constants_1.MESSAGES.USER_CREATED,
        };
    }
    async deleteUser(userId, tenantId, currentUserId) {
        if (userId === currentUserId) {
            throw apiError_1.ApiError.badRequest(constants_1.MESSAGES.CANNOT_DELETE_SELF);
        }
        const targetUser = await repositories_1.userRepository.findById(userId);
        if (!targetUser || targetUser.tenantId !== tenantId) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.USER_NOT_FOUND);
        }
        if (targetUser.role === enums_1.UserRole.SUPER_ADMIN) {
            throw apiError_1.ApiError.badRequest('Super Admin accounts are protected and cannot be deleted.');
        }
        await repositories_1.userRepository.delete(userId);
        return {
            message: constants_1.MESSAGES.USER_DELETED,
        };
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
