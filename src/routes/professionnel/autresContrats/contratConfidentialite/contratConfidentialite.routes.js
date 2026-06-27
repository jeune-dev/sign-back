const express = require('express');
const router = express.Router();
const ContratConfidentialiteController = require('../../../../controllers/professionnel/autresContrats/contratConfidentialite/ContratConfidentialiteController');
const authMiddleware = require('../../../../middlewares/auth.middleware');
const validate = require('../../../../middlewares/validate.middleware');
const { creerContratSimpleSchema, signerContratSchema } = require('../../../../validations/contrats.validation');

router.post('/creation', authMiddleware, validate(creerContratSimpleSchema), ContratConfidentialiteController.creerContrat);
router.post('/:contratId/sign', authMiddleware, validate(signerContratSchema), ContratConfidentialiteController.signerContrat);
router.get('/', authMiddleware, ContratConfidentialiteController.getMesContrats);
router.get('/stats', authMiddleware, ContratConfidentialiteController.getStats);
router.get('/:contratId', authMiddleware, ContratConfidentialiteController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratConfidentialiteController.telechargerContrat);

module.exports = router;
