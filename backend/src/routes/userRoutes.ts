import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middlewares/auth';
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  createUser,
  deleteUser,
} from '../controllers/userController';

const router = Router();

// All routes require authentication and Super Admin privileges
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/', getAllUsers);
router.post('/', createUser);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);

export default router;
