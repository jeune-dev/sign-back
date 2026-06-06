const express = require('express');
const router = express.Router();
const ContratConfidentialiteController = require('../../../../controllers/professionnel/autresContrats/contratConfidentialite/contratConfidentialiteController');
const authMiddleware = require('../../../../middlewares/auth.middleware');

router.post('/creation', authMiddleware, ContratConfidentialiteController.creerContrat);
router.post('/:contratId/sign', authMiddleware, ContratConfidentialiteController.signerContrat);
router.get('/', authMiddleware, ContratConfidentialiteController.getMesContrats);
router.get('/stats', authMiddleware, ContratConfidentialiteController.getStats);
router.get('/:contratId', authMiddleware, ContratConfidentialiteController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratConfidentialiteController.telechargerContrat);

module.exports = router;
