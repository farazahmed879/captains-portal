import { Router } from 'express';
import { getDashboardStats, getMoneyLedger } from '../controllers/dashboardController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/ledger/:kind', getMoneyLedger);

export default router;
