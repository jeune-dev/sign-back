const express = require('express');
const router = express.Router();

const ContratTravailController = require('../../../controllers/professionnel/contratTravail/contratTravailController');
const authMiddleware = require('../../../middlewares/auth.middleware');
const validate = require('../../../middlewares/validate.middleware');
const { creerContratTravailSchema, signerContratSchema, paginationQuery } = require('../../../validations/contrats.validation');

// ============================================================
// 🔹 ROUTES CONTRAT TRAVAIL
// ============================================================

// créer contrat
router.post(
  '/creation-contrat-travail',
  authMiddleware,
  validate(creerContratTravailSchema),
  ContratTravailController.creerContrat
);

// signer contrat (salarié)
router.post(
  '/:contratId/sign',
  authMiddleware,
  validate(signerContratSchema),
  ContratTravailController.signerContrat
);

// mes contrats (employeur)
router.get(
  '/',
  authMiddleware,
  ContratTravailController.getMesContrats
);

// stats
router.get('/stats', authMiddleware, ContratTravailController.getStats);

// détail contrat
router.get(
  '/:contratId',
  authMiddleware,
  ContratTravailController.getContrat
);

// télécharger PDF
router.get(
  '/:contratId/download',
  authMiddleware,
  ContratTravailController.telechargerContrat
);

module.exports = router;