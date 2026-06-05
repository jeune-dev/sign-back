const express = require('express');
const router = express.Router();
const ReconnaissanceDetteController = require('../../../../controllers/professionnel/autresContrats/reconnaissanceDette/reconnaissanceDetteController');
const authMiddleware = require('../../../../middlewares/auth.middleware');

router.post('/creation', authMiddleware, ReconnaissanceDetteController.creerContrat);
router.post('/:contratId/sign', authMiddleware, ReconnaissanceDetteController.signerContrat);
router.get('/', authMiddleware, ReconnaissanceDetteController.getMesContrats);
router.get('/:contratId', authMiddleware, ReconnaissanceDetteController.getContrat);
router.get('/:contratId/download', authMiddleware, ReconnaissanceDetteController.telechargerContrat);

module.exports = router;
