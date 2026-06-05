const express = require('express');
const router = express.Router();
const gestionUtilisateurController = require('../../controllers/admin/gestionutilisateur.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');

router.get('/nombre-utilisateur', adminMiddleware, gestionUtilisateurController.nombreUtilisateur);
router.get('/liste-utilisateur', adminMiddleware, gestionUtilisateurController.listeUtilisateur);
router.get('/nombre-particuliers', adminMiddleware, gestionUtilisateurController.nombreParticuliers);
router.get('/nombre-independants', adminMiddleware, gestionUtilisateurController.nombreIndependants);
router.get('/nombre-professionnels', adminMiddleware, gestionUtilisateurController.nombreProfessionnels);
router.patch('/activer-utilisateur/:id', adminMiddleware, gestionUtilisateurController.activerUtilisateur);
router.patch('/desactiver-utilisateur/:id', adminMiddleware, gestionUtilisateurController.desactiverUtilisateur);

module.exports = router;
