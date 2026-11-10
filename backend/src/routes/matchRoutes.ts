import { Router } from 'express';
import {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
} from '../controllers/matchController';
import { authenticate, requireWriteAccess } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.use(requireWriteAccess);

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.post('/', createMatch);
router.put('/:id', updateMatch);
router.delete('/:id', deleteMatch);

export default router;
