"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePlayerFromTeam = exports.addPlayersToTeam = exports.deleteTeam = exports.updateTeam = exports.createTeam = exports.getTeamById = exports.getTeams = void 0;
const services_1 = require("../services");
const asyncHandler_1 = require("../utils/asyncHandler");
const constants_1 = require("../constants");
exports.getTeams = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const teams = await services_1.teamService.getTeams(req.user.tenantId, {
        id: req.user.id,
        role: req.user.role,
    });
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        teams,
    });
});
exports.getTeamById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await services_1.teamService.getTeamById(String(id), req.user.tenantId);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.createTeam = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const team = await services_1.teamService.createTeam(req.user.tenantId, req.user.id, req.body);
    res.status(constants_1.HTTP_STATUS.CREATED).json({
        success: true,
        team,
    });
});
exports.updateTeam = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const team = await services_1.teamService.updateTeam(String(id), req.user.tenantId, req.body);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        team,
    });
});
exports.deleteTeam = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await services_1.teamService.deleteTeam(String(id), req.user.tenantId);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.addPlayersToTeam = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { playerIds } = req.body;
    const result = await services_1.teamService.addPlayersToTeam(String(id), req.user.tenantId, playerIds);
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
exports.removePlayerFromTeam = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id, playerId } = req.params;
    const result = await services_1.teamService.removePlayerFromTeam(String(id), req.user.tenantId, String(playerId));
    res.status(constants_1.HTTP_STATUS.OK).json({
        success: true,
        ...result,
    });
});
