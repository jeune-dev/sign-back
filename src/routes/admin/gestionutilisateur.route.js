const express = require('express');
const router = express.Router();
const gestionUtilisateurController = require('../../controllers/admin/gestionutilisateur.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const requirePermission = require('../../middlewares/permission.middleware');

router.get('/nombre-utilisateur', adminMiddleware, requirePermission('users'), gestionUtilisateurController.nombreUtilisateur);
router.get('/liste-utilisateur', adminMiddleware, requirePermission('users'), gestionUtilisateurController.listeUtilisateur);
router.get('/nombre-particuliers', adminMiddleware, requirePermission('users'), gestionUtilisateurController.nombreParticuliers);
router.get('/nombre-independants', adminMiddleware, requirePermission('users'), gestionUtilisateurController.nombreIndependants);
router.get('/nombre-professionnels', adminMiddleware, requirePermission('users'), gestionUtilisateurController.nombreProfessionnels);
router.patch('/activer-utilisateur/:id', adminMiddleware, requirePermission('users'), gestionUtilisateurController.activerUtilisateur);
router.patch('/desactiver-utilisateur/:id', adminMiddleware, requirePermission('users'), gestionUtilisateurController.desactiverUtilisateur);
router.delete('/utilisateur/:id', adminMiddleware, requirePermission('users'), gestionUtilisateurController.supprimerUtilisateur);

module.exports = router;
