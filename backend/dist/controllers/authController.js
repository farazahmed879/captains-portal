"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDashboardSettings = exports.getMe = exports.register = exports.login = exports.verifyPassword = void 0;
const services_1 = require("../services");
const asyncHandler_1 = require("../utils/asyncHandler");
const constants_1 = require("../constants");
exports.verifyPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { password } = req.body;
    const result = await services_1.authService.verifyPassword(req.user.id, password);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { phone, email, identifier, password } = req.body;
    const rawIdentifier = (phone || identifier || email || '').trim();
    const result = await services_1.authService.login(rawIdentifier, password);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        message: constants_1.MESSAGES.AUTH_SUCCESS,
        ...result,
    });
});
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.authService.register(req.body);
    res.status(constants_1.HTTP_STATUS.CREATED).json({
        success: true,
        message: constants_1.MESSAGES.ACCOUNT_REGISTERED,
        ...result,
    });
});
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await services_1.authService.getMe(req.user.id);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        user,
    });
});
exports.updateDashboardSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { widgets, selections } = req.body;
    const updated = await services_1.authService.updateDashboardSettings(req.user.id, {
        widgets: widgets || [],
        selections: selections || {},
    });
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        message: 'Dashboard settings updated successfully',
        settings: updated.dashboardSettings,
    });
});
