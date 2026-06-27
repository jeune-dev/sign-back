'use strict';
const StatistiquesService = require('../../services/admin/statistiques.service');
const asyncHandler = require('../../middlewares/asyncHandler');
exports.statistiques = asyncHandler(async (req, res) => {
  const result = await StatistiquesService.getStatistiques();
  res.status(200).json({ success: true, message: 'Statistiques récupérées', data: result.stats });
});
