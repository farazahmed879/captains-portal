import { Router } from 'express';
import {
  createPayment,
  updatePayment,
  deletePayment,
  bulkUpdatePayments,
} from '../controllers/matchPaymentController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.post('/', createPayment);
router.put('/bulk', bulkUpdatePayments);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;
