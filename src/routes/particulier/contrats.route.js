'use strict';

const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { signerContratSchema, contratQuerySchema } = require('../../validations/contrats.validation');
const ParticulierContratsController = require('../../controllers/particulier/contrats.controller');

// GET /sign/particulier/contrats?statut=signe|en_attente
router.get('/', authMiddleware, validate(contratQuerySchema, 'query'), ParticulierContratsController.getTousContrats);

// GET /sign/particulier/contrats/:type?statut=signe|en_attente
router.get('/:type', authMiddleware, validate(contratQuerySchema, 'query'), ParticulierContratsController.getContratsByType);

// GET /sign/particulier/contrats/:type/:contratId
router.get('/:type/:contratId', authMiddleware, ParticulierContratsController.getContratDetail);

// GET /sign/particulier/contrats/:type/:contratId/pdf
router.get('/:type/:contratId/pdf', authMiddleware, ParticulierContratsController.getPdf);

// POST /sign/particulier/contrats/:type/:contratId/signer
router.post('/:type/:contratId/signer', authMiddleware, validate(signerContratSchema), ParticulierContratsController.signerContrat);

module.exports = router;
