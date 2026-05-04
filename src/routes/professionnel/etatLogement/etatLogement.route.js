const express = require('express');
const router = express.Router();

const EtatLogementController = require('../../../controllers/professionnel/etatLogement/etatLogementController');
const authMiddleware = require('../../../middlewares/auth.middleware');


// ============================================================
// 🔹 CRÉER ÉTAT DES LIEUX
// ============================================================
router.post(
  '/:contratId',
  authMiddleware,
  EtatLogementController.creerEtatDesLieux
);


// ============================================================
// 🔹 LISTE MES ÉTATS DES LIEUX
// ============================================================
router.get(
  '/',
  authMiddleware,
  EtatLogementController.getMesEtatsDesLieux
);


// ============================================================
// 🔹 DÉTAIL ÉTAT DES LIEUX
// ============================================================
router.get(
  '/:etatId',
  authMiddleware,
  EtatLogementController.getEtatDesLieux
);


// ============================================================
// 🔹 SIGNER ÉTAT DES LIEUX (LOCATAIRE)
// ============================================================
router.post(
  '/:etatId/signer',
  authMiddleware,
  EtatLogementController.signerEtatDesLieux
);


// ============================================================
// 🔹 TÉLÉCHARGER PDF
// ============================================================
router.get(
  '/:etatId/pdf',
  authMiddleware,
  EtatLogementController.telechargerEtatDesLieux
);

module.exports = router;