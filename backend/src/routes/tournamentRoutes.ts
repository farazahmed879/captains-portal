import { Router } from 'express';
import {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
} from '../controllers/tournamentController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.post('/', createTournament);
router.put('/:id', updateTournament);
router.delete('/:id', deleteTournament);

export default router;
