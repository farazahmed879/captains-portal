import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await userService.getAllUsers(req.user!.tenantId);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const result = await userService.updateUserRole(String(id), req.user!.tenantId, role);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const result = await userService.toggleUserStatus(
    String(id),
    req.user!.tenantId,
    req.user!.id,
    Boolean(isActive)
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await userService.createUser(req.user!.tenantId, req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    ...result,
  });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await userService.deleteUser(String(id), req.user!.tenantId, req.user!.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});
