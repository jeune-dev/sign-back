const express = require('express');
const router = express.Router();
const gestionUtilisateurController = require('../../controllers/admin/gestionutilisateur.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const requirePermission = require('../../middlewares/permission.middleware');
const { adminRateLimit } = require('../../middlewares/rateLimit.middleware');
const validate = require('../../middlewares/validate.middleware');
const { paginationQuery } = require('../../validations/contrats.validation');

router.get('/nombre-utilisateur', adminMiddleware, adminRateLimit, requirePermission('users'), gestionUtilisateurController.nombreUtilisateur);
router.get('/liste-utilisateur', adminMiddleware, adminRateLimit, requirePermission('users'), validate(paginationQuery, 'query'), gestionUtilisateurController.listeUtilisateur);
router.get('/nombre-particuliers', adminMiddleware, adminRateLimit, requirePermission('users'), gestionUtilisateurController.nombreParticuliers);
router.get('/nombre-independants', adminMiddleware, adminRateLimit, requirePermission('users'), gestionUtilisateurController.nombreIndependants);
router.get('/nombre-professionnels', adminMiddleware, adminRateLimit, requirePermission('users'), gestionUtilisateurController.nombreProfessionnels);
router.patch('/activer-utilisateur/:id', adminMiddleware, adminRateLimit, requirePermission('users'), gestionUtilisateurController.activerUtilisateur);
router.patch('/desactiver-utilisateur/:id', adminMiddleware, adminRateLimit, requirePermission('users'), gestionUtilisateurController.desactiverUtilisateur);
router.delete('/utilisateur/:id', adminMiddleware, adminRateLimit, requirePermission('users'), gestionUtilisateurController.supprimerUtilisateur);

module.exports = router;
