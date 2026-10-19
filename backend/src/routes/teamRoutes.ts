import { Router } from 'express';
import { getTeams, getTeamById, createTeam, updateTeam, deleteTeam } from '../controllers/teamController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

export default router;
