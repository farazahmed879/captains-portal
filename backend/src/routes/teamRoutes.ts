import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayersToTeam,
  removePlayerFromTeam,
} from '../controllers/teamController';
import { authenticate, requireWriteAccess } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.use(requireWriteAccess);

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/players', addPlayersToTeam);
router.delete('/:id/players/:playerId', removePlayerFromTeam);

export default router;
