import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { authService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { phone, email, identifier, password } = req.body;
  const rawIdentifier = (phone || identifier || email || '').trim();

  const result = await authService.login(rawIdentifier, password);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.AUTH_SUCCESS,
    ...result,
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: MESSAGES.ACCOUNT_REGISTERED,
    ...result,
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    user,
  });
});

export const updateDashboardSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { widgets, selections } = req.body;
  const updated = await authService.updateDashboardSettings(req.user!.id, {
    widgets: widgets || [],
    selections: selections || {},
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Dashboard settings updated successfully',
    settings: updated.dashboardSettings,
  });
});
