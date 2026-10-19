import { Router } from 'express';
import {
  getPlayers,
  getPlayerProfile,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from '../controllers/playerController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', getPlayers);
router.get('/:id', getPlayerProfile);
router.get('/:id/profile', getPlayerProfile);
router.post('/', createPlayer);
router.put('/:id', updatePlayer);
router.delete('/:id', deletePlayer);

export default router;
