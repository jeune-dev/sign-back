const express = require('express');
const router = express.Router();
const ContratPrestationController = require('../../../../controllers/professionnel/autresContrats/contratPrestation/ContratPrestationController');
const authMiddleware = require('../../../../middlewares/auth.middleware');
const validate = require('../../../../middlewares/validate.middleware');
const { creerContratSimpleSchema, signerContratSchema } = require('../../../../validations/contrats.validation');

router.post('/creation', authMiddleware, validate(creerContratSimpleSchema), ContratPrestationController.creerContrat);
router.post('/:contratId/sign', authMiddleware, validate(signerContratSchema), ContratPrestationController.signerContrat);
router.get('/', authMiddleware, ContratPrestationController.getMesContrats);
router.get('/stats', authMiddleware, ContratPrestationController.getStats);
router.get('/:contratId', authMiddleware, ContratPrestationController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratPrestationController.telechargerContrat);

module.exports = router;
