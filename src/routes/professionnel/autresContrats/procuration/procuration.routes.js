const express = require('express');
const router = express.Router();
const ProcurationController = require('../../../../controllers/professionnel/autresContrats/procuration/procurationController');
const authMiddleware = require('../../../../middlewares/auth.middleware');

router.post('/creation', authMiddleware, ProcurationController.creerContrat);
router.post('/:contratId/sign', authMiddleware, ProcurationController.signerContrat);
router.get('/', authMiddleware, ProcurationController.getMesContrats);
router.get('/stats', authMiddleware, ProcurationController.getStats);
router.get('/:contratId', authMiddleware, ProcurationController.getContrat);
router.get('/:contratId/download', authMiddleware, ProcurationController.telechargerContrat);

module.exports = router;
