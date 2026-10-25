import { Router } from 'express';
import { login, register, getMe, updateDashboardSettings } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.put('/dashboard-settings', authenticate, updateDashboardSettings);

export default router;
