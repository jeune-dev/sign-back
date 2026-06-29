const express = require('express');
const router = express.Router();
const gestionFactureController = require('../../controllers/admin/gestionfacture.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const requirePermission = require('../../middlewares/permission.middleware');
const { adminRateLimit } = require('../../middlewares/rateLimit.middleware');
const validate = require('../../middlewares/validate.middleware');
const { paginationQuery } = require('../../validations/contrats.validation');

router.get('/nombre-facture', adminMiddleware, adminRateLimit, requirePermission('factures'), gestionFactureController.nombreFactures);
router.get('/consulter-facture/:id', adminMiddleware, adminRateLimit, requirePermission('factures'), gestionFactureController.consulterFacture);
router.get('/facture-pdf/:id', adminMiddleware, adminRateLimit, requirePermission('factures'), gestionFactureController.telechargerFacturePdf);
router.get('/liste-factures', adminMiddleware, adminRateLimit, requirePermission('factures'), validate(paginationQuery, 'query'), gestionFactureController.listeFacture);

module.exports = router;
