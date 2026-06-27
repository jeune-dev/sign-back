const express = require('express');
const router = express.Router();
const ContratLocationController = require('../../../../controllers/professionnel/autresContrats/contratLocation/ContratLocationController');
const authMiddleware = require('../../../../middlewares/auth.middleware');
const validate = require('../../../../middlewares/validate.middleware');
const { creerContratSimpleSchema, signerContratSchema } = require('../../../../validations/contrats.validation');

router.post('/creation', authMiddleware, validate(creerContratSimpleSchema), ContratLocationController.creerContrat);
router.post('/:contratId/sign', authMiddleware, validate(signerContratSchema), ContratLocationController.signerContrat);
router.get('/', authMiddleware, ContratLocationController.getMesContrats);
router.get('/stats', authMiddleware, ContratLocationController.getStats);
router.get('/:contratId', authMiddleware, ContratLocationController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratLocationController.telechargerContrat);

module.exports = router;
