const express = require('express');
const router  = express.Router();
const gestionContratController = require('../../controllers/admin/gestionContrat.controller');
const adminMiddleware           = require('../../middlewares/admin.middleware');

router.get('/nombre-contrats',            adminMiddleware, gestionContratController.nombreContrats);
router.get('/consulter-contrat/:type/:id',adminMiddleware, gestionContratController.consulterContrat);
router.get('/liste-contrats',             adminMiddleware, gestionContratController.listeContrats);

module.exports = router;
