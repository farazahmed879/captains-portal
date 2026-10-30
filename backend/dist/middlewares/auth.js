"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (token) {
            const secret = process.env.JWT_SECRET || 'captains_portal_super_secret_jwt_key_2026';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            req.user = decoded;
            return next();
        }
        // Single-tenant / Super admin test fallback for seamless development & testing
        const defaultUser = await User_1.User.findOne({ role: 'super_admin' });
        if (defaultUser) {
            req.user = {
                id: defaultUser._id.toString(),
                tenantId: defaultUser.tenantId.toString(),
                email: defaultUser.email,
                role: defaultUser.role,
                name: defaultUser.name,
            };
            return next();
        }
        res.status(401).json({ success: false, message: 'Authentication required. No super admin found.' });
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};
exports.authenticate = authenticate;
const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Admin authorization required.' });
        return;
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
