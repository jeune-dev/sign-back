const express = require('express');
const router = express.Router();
const ContratLocationController = require('../../../../controllers/professionnel/autresContrats/contratLocation/contratLocationController');
const authMiddleware = require('../../../../middlewares/auth.middleware');

router.post('/creation', authMiddleware, ContratLocationController.creerContrat);
router.post('/:contratId/sign', authMiddleware, ContratLocationController.signerContrat);
router.get('/', authMiddleware, ContratLocationController.getMesContrats);
router.get('/stats', authMiddleware, ContratLocationController.getStats);
router.get('/:contratId', authMiddleware, ContratLocationController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratLocationController.telechargerContrat);

module.exports = router;
