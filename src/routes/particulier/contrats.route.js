'use strict';

const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const ParticulierContratsController = require('../../controllers/particulier/contrats.controller');

// GET /sign/particulier/contrats?statut=signe|en_attente
router.get('/', authMiddleware, ParticulierContratsController.getTousContrats);

// GET /sign/particulier/contrats/:type?statut=signe|en_attente
router.get('/:type', authMiddleware, ParticulierContratsController.getContratsByType);

// GET /sign/particulier/contrats/:type/:contratId
router.get('/:type/:contratId', authMiddleware, ParticulierContratsController.getContratDetail);

// POST /sign/particulier/contrats/:type/:contratId/signer
router.post('/:type/:contratId/signer', authMiddleware, ParticulierContratsController.signerContrat);

module.exports = router;
