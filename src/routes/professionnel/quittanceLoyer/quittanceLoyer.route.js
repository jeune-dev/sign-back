const express = require('express');
const router = express.Router();

const QuittanceLoyerController = require('../../../controllers/professionnel/quittanceLoyer/quittanceLoyerController');
const authMiddleware = require('../../../middlewares/auth.middleware');
const validate = require('../../../middlewares/validate.middleware');
const { creerQuittanceSchema } = require('../../../validations/contrats.validation');

// ============================================================
// 🔹 ROUTES QUITTANCE DE LOYER
// ============================================================

// créer une quittance de loyer
router.post(
  '/creation-quittance-loyer',
  authMiddleware,
  validate(creerQuittanceSchema),
  QuittanceLoyerController.creerQuittance
);

// mes quittances (bailleur)
router.get(
  '/',
  authMiddleware,
  QuittanceLoyerController.getMesQuittances
);

// détail d’une quittance
router.get(
  '/:quittanceId',
  authMiddleware,
  QuittanceLoyerController.getQuittance
);

// télécharger PDF quittance
router.get(
  '/:quittanceId/download',
  authMiddleware,
  QuittanceLoyerController.telechargerQuittance
);

module.exports = router;