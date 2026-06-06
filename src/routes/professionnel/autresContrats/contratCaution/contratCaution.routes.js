const express = require('express');
const router = express.Router();
const ContratCautionController = require('../../../../controllers/professionnel/autresContrats/contratCaution/contratCautionController');
const authMiddleware = require('../../../../middlewares/auth.middleware');

router.post('/creation', authMiddleware, ContratCautionController.creerContrat);
router.post('/:contratId/sign', authMiddleware, ContratCautionController.signerContrat);
router.get('/', authMiddleware, ContratCautionController.getMesContrats);
router.get('/stats', authMiddleware, ContratCautionController.getStats);
router.get('/:contratId', authMiddleware, ContratCautionController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratCautionController.telechargerContrat);

module.exports = router;
