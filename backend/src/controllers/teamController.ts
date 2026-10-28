import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { teamService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

export const getTeams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const teams = await teamService.getTeams(req.user!.tenantId, {
    id: req.user!.id,
    role: req.user!.role,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    teams,
  });
});

export const getTeamById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await teamService.getTeamById(String(id), req.user!.tenantId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const createTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await teamService.createTeam(req.user!.tenantId, req.user!.id, req.body);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    team,
  });
});

export const updateTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const team = await teamService.updateTeam(String(id), req.user!.tenantId, req.body);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    team,
  });
});

export const deleteTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await teamService.deleteTeam(String(id), req.user!.tenantId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const addPlayersToTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { playerIds } = req.body;
  const result = await teamService.addPlayersToTeam(String(id), req.user!.tenantId, playerIds);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const removePlayerFromTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, playerId } = req.params;
  const result = await teamService.removePlayerFromTeam(
    String(id),
    req.user!.tenantId,
    String(playerId)
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});
