const express = require('express');
const router = express.Router();
const ContratPrestationController = require('../../../../controllers/professionnel/autresContrats/contratPrestation/contratPrestationController');
const authMiddleware = require('../../../../middlewares/auth.middleware');

router.post('/creation', authMiddleware, ContratPrestationController.creerContrat);
router.post('/:contratId/sign', authMiddleware, ContratPrestationController.signerContrat);
router.get('/', authMiddleware, ContratPrestationController.getMesContrats);
router.get('/stats', authMiddleware, ContratPrestationController.getStats);
router.get('/:contratId', authMiddleware, ContratPrestationController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratPrestationController.telechargerContrat);

module.exports = router;
