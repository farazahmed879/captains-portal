import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { playerService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

export const getPlayers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId } = req.query;
  const players = await playerService.getPlayers(req.user!.tenantId, teamId as string | undefined);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    players,
  });
});

export const getPlayerById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await playerService.getPlayerById(String(id), req.user!.tenantId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const getPlayerProfile = getPlayerById;

export const createPlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const player = await playerService.createPlayer(req.user!.tenantId, req.body);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    player,
  });
});

export const updatePlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const player = await playerService.updatePlayer(String(id), req.user!.tenantId, req.body);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    player,
  });
});

export const deletePlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await playerService.deletePlayer(String(id), req.user!.tenantId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});
