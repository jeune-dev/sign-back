const express = require('express');
const router  = express.Router();
const gestionContratController = require('../../controllers/admin/gestionContrat.controller');
const adminMiddleware           = require('../../middlewares/admin.middleware');
const requirePermission         = require('../../middlewares/permission.middleware');
const validate                  = require('../../middlewares/validate.middleware');
const { paginationQuery }       = require('../../validations/contrats.validation');

router.get('/nombre-contrats',            adminMiddleware, requirePermission('contrats'), gestionContratController.nombreContrats);
router.get('/consulter-contrat/:type/:id',adminMiddleware, requirePermission('contrats'), gestionContratController.consulterContrat);
router.get('/contrat-pdf/:type/:id',      adminMiddleware, requirePermission('contrats'), gestionContratController.telechargerContratPdf);
router.get('/liste-contrats',             adminMiddleware, requirePermission('contrats'), validate(paginationQuery, 'query'), gestionContratController.listeContrats);

module.exports = router;
