import { Router } from 'express';
import {
  createPlayerReturn,
  getPlayerReturns,
  updatePlayerReturn,
  deletePlayerReturn,
} from '../controllers/playerReturnController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.post('/', createPlayerReturn);
router.get('/', getPlayerReturns);
router.put('/:id', updatePlayerReturn);
router.delete('/:id', deletePlayerReturn);

export default router;
