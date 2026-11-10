import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';
import { authenticate, requireWriteAccess } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.use(requireWriteAccess);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
