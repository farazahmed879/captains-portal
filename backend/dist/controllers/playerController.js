"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlayer = exports.updatePlayer = exports.createPlayer = exports.getPlayerProfile = exports.getPlayerById = exports.getPlayers = void 0;
const services_1 = require("../services");
const asyncHandler_1 = require("../utils/asyncHandler");
const constants_1 = require("../constants");
exports.getPlayers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { teamId } = req.query;
    const players = await services_1.playerService.getPlayers(req.user.tenantId, teamId);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        players,
    });
});
exports.getPlayerById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await services_1.playerService.getPlayerById(String(id), req.user.tenantId);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.getPlayerProfile = exports.getPlayerById;
exports.createPlayer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const player = await services_1.playerService.createPlayer(req.user.tenantId, req.body);
    res.status(constants_1.HTTP_STATUS.CREATED).json({
        success: true,
        player,
    });
});
exports.updatePlayer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const player = await services_1.playerService.updatePlayer(String(id), req.user.tenantId, req.body);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        player,
    });
});
exports.deletePlayer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await services_1.playerService.deletePlayer(String(id), req.user.tenantId);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
