const express = require('express');
const router = express.Router();
const gestionFactureController = require('../../controllers/admin/gestionfacture.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');

router.get('/nombre-facture', adminMiddleware, gestionFactureController.nombreFactures);
router.get('/consulter-facture/:id', adminMiddleware, gestionFactureController.consulterFacture);
router.get('/liste-factures', adminMiddleware, gestionFactureController.listeFacture);

module.exports = router;
