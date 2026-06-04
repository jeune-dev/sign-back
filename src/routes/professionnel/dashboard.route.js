const express = require('express');
const router = express.Router();

const auth = require('../../middlewares/auth.middleware');
const checkActiveUser = require('../../middlewares/checkActiveUser.middleware');
const DashboardProfessionnelController = require('../../controllers/professionnel/dashboard.controller');


// ============================================================
// 🔹 DASHBOARD PROFESSIONNEL ROUTES
// ============================================================

router.get(
    '/nombre-contrats-immobilier',
    auth,
    checkActiveUser,
    DashboardProfessionnelController.getNombreContratsImmobilier
);

router.get(
    '/nombre-contrats-travail',
    auth,
    checkActiveUser,
    DashboardProfessionnelController.getNombreContratsTravail
);


router.get(
    '/nombre-factures',
    auth,
    checkActiveUser,
    DashboardProfessionnelController.getNombreFactures
);

module.exports = router;