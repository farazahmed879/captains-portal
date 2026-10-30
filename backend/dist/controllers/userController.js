"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.createUser = exports.toggleUserStatus = exports.updateUserRole = exports.getAllUsers = void 0;
const services_1 = require("../services");
const asyncHandler_1 = require("../utils/asyncHandler");
const constants_1 = require("../constants");
exports.getAllUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.userService.getAllUsers(req.user.tenantId);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.updateUserRole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const result = await services_1.userService.updateUserRole(String(id), req.user.tenantId, role);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.toggleUserStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const result = await services_1.userService.toggleUserStatus(String(id), req.user.tenantId, req.user.id, Boolean(isActive));
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.createUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.userService.createUser(req.user.tenantId, req.body);
    res.status(constants_1.HTTP_STATUS.CREATED).json({
        success: true,
        ...result,
    });
});
exports.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await services_1.userService.deleteUser(String(id), req.user.tenantId, req.user.id);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
