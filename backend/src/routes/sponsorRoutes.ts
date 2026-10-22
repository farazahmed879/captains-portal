import { Router } from 'express';
import {
  getSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  addSponsorTransaction,
  updateSponsorTransaction,
  deleteSponsorTransaction,
} from '../controllers/sponsorController';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', getSponsors);
router.get('/:id', getSponsorById);
router.post('/', createSponsor);
router.put('/:id', updateSponsor);
router.delete('/:id', deleteSponsor);

// Sponsor ledger (top-ups / payouts)
router.post('/:id/transactions', addSponsorTransaction);
router.put('/:id/transactions/:txId', updateSponsorTransaction);
router.delete('/:id/transactions/:txId', deleteSponsorTransaction);

export default router;
