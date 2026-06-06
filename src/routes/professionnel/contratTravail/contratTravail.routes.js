const express = require('express');
const router = express.Router();

const ContratTravailController = require('../../../controllers/professionnel/contratTravail/contratTravailController');

// 👉 middleware auth obligatoire
const authMiddleware = require('../../../middlewares/auth.middleware');

// ============================================================
// 🔹 ROUTES CONTRAT TRAVAIL
// ============================================================

// créer contrat
router.post(
  '/creation-contrat-travail',
  authMiddleware,
  ContratTravailController.creerContrat
);

// signer contrat (salarié)
router.post(
  '/:contratId/sign',
  authMiddleware,
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