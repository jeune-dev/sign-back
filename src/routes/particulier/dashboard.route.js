'use strict';

const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const ParticulierDashboardController = require('../../controllers/particulier/dashboard.controller');

// GET /sign/particulier/dashboard/stats
router.get('/stats', authMiddleware, ParticulierDashboardController.getStats);

module.exports = router;
