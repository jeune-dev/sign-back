const express = require('express');
const router = express.Router();


const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const checkActiveUser = require('../../middlewares/checkActiveUser.middleware');
const DashboardProfessionnelController = require('../../controllers/professionnel/dashboard.controller');


// ============================================================
// 🔹 DASHBOARD PROFESSIONNEL ROUTES
// ============================================================

router.get(
    '/contrats/nombre',
    auth,
    checkActiveUser,
    DashboardProfessionnelController.getNombreContrats
);

router.get(
    '/factures/nombre',
    auth,
    checkActiveUser,
    DashboardProfessionnelController.getNombreFactures
);

module.exports = router;