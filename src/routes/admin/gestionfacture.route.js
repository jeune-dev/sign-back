const express = require('express');
const router = express.Router();
const gestionFactureController = require('../../controllers/admin/gestionfacture.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const requirePermission = require('../../middlewares/permission.middleware');

router.get('/nombre-facture', adminMiddleware, requirePermission('factures'), gestionFactureController.nombreFactures);
router.get('/consulter-facture/:id', adminMiddleware, requirePermission('factures'), gestionFactureController.consulterFacture);
router.get('/facture-pdf/:id', adminMiddleware, requirePermission('factures'), gestionFactureController.telechargerFacturePdf);
router.get('/liste-factures', adminMiddleware, requirePermission('factures'), gestionFactureController.listeFacture);

module.exports = router;
