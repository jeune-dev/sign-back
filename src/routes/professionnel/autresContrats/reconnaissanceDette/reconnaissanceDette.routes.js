const express = require('express');
const router = express.Router();
const ReconnaissanceDetteController = require('../../../../controllers/professionnel/autresContrats/reconnaissanceDette/reconnaissanceDetteController');
const authMiddleware = require('../../../../middlewares/auth.middleware');
const validate = require('../../../../middlewares/validate.middleware');
const { creerContratSimpleSchema, signerContratSchema } = require('../../../../validations/contrats.validation');

router.post('/creation', authMiddleware, validate(creerContratSimpleSchema), ReconnaissanceDetteController.creerContrat);
router.post('/:contratId/sign', authMiddleware, validate(signerContratSchema), ReconnaissanceDetteController.signerContrat);
router.get('/', authMiddleware, ReconnaissanceDetteController.getMesContrats);
router.get('/stats', authMiddleware, ReconnaissanceDetteController.getStats);
router.get('/:contratId', authMiddleware, ReconnaissanceDetteController.getContrat);
router.get('/:contratId/download', authMiddleware, ReconnaissanceDetteController.telechargerContrat);

module.exports = router;
