"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const services_1 = require("../services");
const asyncHandler_1 = require("../utils/asyncHandler");
const constants_1 = require("../constants");
exports.getDashboardStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { teamId } = req.query;
    const result = await services_1.dashboardService.getStats(req.user.tenantId, {
        id: req.user.id,
        role: req.user.role,
    }, teamId);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
