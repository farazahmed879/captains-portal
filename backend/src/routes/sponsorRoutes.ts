import { Router } from 'express';
import {
  getSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from '../controllers/sponsorController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', getSponsors);
router.get('/:id', getSponsorById);
router.post('/', createSponsor);
router.put('/:id', updateSponsor);
router.delete('/:id', deleteSponsor);

export default router;
