'use strict';

const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { paginationQuery } = require('../../validations/contrats.validation');
const ParticulierFacturesController = require('../../controllers/particulier/factures.controller');

// GET /sign/particulier/factures?statut=signe|en_attente&page=1&limit=20
router.get('/', authMiddleware, validate(paginationQuery, 'query'), ParticulierFacturesController.getFactures);

// GET /sign/particulier/factures/:factureId
router.get('/:factureId', authMiddleware, ParticulierFacturesController.getFactureDetail);

module.exports = router;
