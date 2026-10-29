import { Router } from 'express';
import {
  createPayment,
  updatePayment,
  deletePayment,
  bulkUpdatePayments,
  markAllMatchPaymentsPaid,
} from '../controllers/matchPaymentController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.post('/', createPayment);
router.put('/bulk', bulkUpdatePayments);
router.put('/matches/:matchId/mark-all-paid', markAllMatchPaymentsPaid);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;
