const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const checkActiveUser = require('../../middlewares/checkActiveUser.middleware');
const DashboardProfessionnelController = require('../../controllers/professionnel/dashboard.controller');

router.get('/stats', auth, checkActiveUser, DashboardProfessionnelController.getStats);

module.exports = router;
