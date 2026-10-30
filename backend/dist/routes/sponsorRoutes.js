"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sponsorController_1 = require("../controllers/sponsorController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', sponsorController_1.getSponsors);
router.get('/:id', sponsorController_1.getSponsorById);
router.post('/', sponsorController_1.createSponsor);
router.put('/:id', sponsorController_1.updateSponsor);
router.delete('/:id', sponsorController_1.deleteSponsor);
// Sponsor ledger (top-ups / payouts)
router.post('/:id/transactions', sponsorController_1.addSponsorTransaction);
router.put('/:id/transactions/:txId', sponsorController_1.updateSponsorTransaction);
router.delete('/:id/transactions/:txId', sponsorController_1.deleteSponsorTransaction);
exports.default = router;
