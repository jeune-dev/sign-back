const express = require('express');
const router = express.Router();
const ContratCautionController = require('../../../../controllers/professionnel/autresContrats/contratCaution/ContratCautionController');
const authMiddleware = require('../../../../middlewares/auth.middleware');
const validate = require('../../../../middlewares/validate.middleware');
const { creerContratSimpleSchema, signerContratSchema } = require('../../../../validations/contrats.validation');

router.post('/creation', authMiddleware, validate(creerContratSimpleSchema), ContratCautionController.creerContrat);
router.post('/:contratId/sign', authMiddleware, validate(signerContratSchema), ContratCautionController.signerContrat);
router.get('/', authMiddleware, ContratCautionController.getMesContrats);
router.get('/stats', authMiddleware, ContratCautionController.getStats);
router.get('/:contratId', authMiddleware, ContratCautionController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratCautionController.telechargerContrat);

module.exports = router;
