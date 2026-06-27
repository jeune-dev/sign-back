const express = require('express');
const router = express.Router();
const statistiquesController = require('../../controllers/admin/statistiques.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');

router.get('/statistiques', adminMiddleware, statistiquesController.statistiques);

module.exports = router;
