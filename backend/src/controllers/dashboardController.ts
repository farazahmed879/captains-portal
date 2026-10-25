import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { dashboardService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId } = req.query;

  const result = await dashboardService.getStats(
    req.user!.tenantId,
    {
      id: req.user!.id,
      role: req.user!.role,
    },
    teamId as string | undefined
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});
