const express = require('express');
const router = express.Router();
const ContratPartenariatController = require('../../../../controllers/professionnel/autresContrats/contratPartenariat/ContratPartenariatController');
const authMiddleware = require('../../../../middlewares/auth.middleware');
const validate = require('../../../../middlewares/validate.middleware');
const { creerContratSimpleSchema, signerContratSchema } = require('../../../../validations/contrats.validation');

router.post('/creation', authMiddleware, validate(creerContratSimpleSchema), ContratPartenariatController.creerContrat);
router.post('/:contratId/sign', authMiddleware, validate(signerContratSchema), ContratPartenariatController.signerContrat);
router.get('/', authMiddleware, ContratPartenariatController.getMesContrats);
router.get('/stats', authMiddleware, ContratPartenariatController.getStats);
router.get('/:contratId', authMiddleware, ContratPartenariatController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratPartenariatController.telechargerContrat);

module.exports = router;
