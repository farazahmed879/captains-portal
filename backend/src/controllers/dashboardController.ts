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

/** Itemised list behind the dashboard's Total Invested / Total Returns / Net Profit-Loss cards. */
export const getMoneyLedger = asyncHandler(async (req: AuthRequest, res: Response) => {
  const kind = req.params.kind;
  if (kind !== 'invested' && kind !== 'returns' && kind !== 'pnl') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Unknown ledger type' });
    return;
  }
  const result = await dashboardService.getMoneyLedger(
    req.user!.tenantId,
    { id: req.user!.id, role: req.user!.role },
    kind
  );
  res.status(HTTP_STATUS.OK).json({ success: true, ...result });
});
