const express = require('express');
const router = express.Router();
const ContratPartenariatController = require('../../../../controllers/professionnel/autresContrats/contratPartenariat/contratPartenariatController');
const authMiddleware = require('../../../../middlewares/auth.middleware');

router.post('/creation', authMiddleware, ContratPartenariatController.creerContrat);
router.post('/:contratId/sign', authMiddleware, ContratPartenariatController.signerContrat);
router.get('/', authMiddleware, ContratPartenariatController.getMesContrats);
router.get('/stats', authMiddleware, ContratPartenariatController.getStats);
router.get('/:contratId', authMiddleware, ContratPartenariatController.getContrat);
router.get('/:contratId/download', authMiddleware, ContratPartenariatController.telechargerContrat);

module.exports = router;
