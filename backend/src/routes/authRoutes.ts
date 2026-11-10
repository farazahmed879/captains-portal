import { Router } from 'express';
import {
  login,
  register,
  getMe,
  updateMe,
  changePassword,
  updateDashboardSettings,
  verifyPassword,
} from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.put('/password', authenticate, changePassword);
router.put('/dashboard-settings', authenticate, updateDashboardSettings);
router.post('/verify-password', authenticate, verifyPassword);

export default router;
