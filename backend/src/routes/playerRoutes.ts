import { Router } from 'express';
import {
  getPlayers,
  getPlayerProfile,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from '../controllers/playerController';
import { authenticate, requireWriteAccess } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.use(requireWriteAccess);

router.get('/', getPlayers);
router.get('/:id', getPlayerProfile);
router.get('/:id/profile', getPlayerProfile);
router.post('/', createPlayer);
router.put('/:id', updatePlayer);
router.delete('/:id', deletePlayer);

export default router;
