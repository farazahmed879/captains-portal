import { Router } from 'express';
import { updatePayment, bulkUpdatePayments } from '../controllers/matchPaymentController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.put('/bulk', bulkUpdatePayments);
router.put('/:id', updatePayment);

export default router;
