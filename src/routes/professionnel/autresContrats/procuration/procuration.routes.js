const express = require('express');
const router = express.Router();
const ProcurationController = require('../../../../controllers/professionnel/autresContrats/procuration/ProcurationController');
const authMiddleware = require('../../../../middlewares/auth.middleware');
const validate = require('../../../../middlewares/validate.middleware');
const { creerContratSimpleSchema, signerContratSchema } = require('../../../../validations/contrats.validation');

router.post('/creation', authMiddleware, validate(creerContratSimpleSchema), ProcurationController.creerContrat);
router.post('/:contratId/sign', authMiddleware, validate(signerContratSchema), ProcurationController.signerContrat);
router.get('/', authMiddleware, ProcurationController.getMesContrats);
router.get('/stats', authMiddleware, ProcurationController.getStats);
router.get('/:contratId', authMiddleware, ProcurationController.getContrat);
router.get('/:contratId/download', authMiddleware, ProcurationController.telechargerContrat);

module.exports = router;
