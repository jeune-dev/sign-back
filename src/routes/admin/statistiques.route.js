const express = require('express');
const router = express.Router();
const statistiquesController = require('../../controllers/admin/statistiques.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const { adminRateLimit } = require('../../middlewares/rateLimit.middleware');

router.get('/statistiques', adminMiddleware, adminRateLimit, statistiquesController.statistiques);

module.exports = router;
