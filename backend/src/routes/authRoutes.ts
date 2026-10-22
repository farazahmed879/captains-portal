import { Router } from 'express';
import { login, getMe, updateDashboardSettings } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/dashboard-settings', authenticate, updateDashboardSettings);

export default router;
