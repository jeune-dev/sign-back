'use strict';
const DashboardProfessionnelService = require('../../services/professionnel/dashboard.service');
const asyncHandler = require('../../middlewares/asyncHandler');
class DashboardProfessionnelController {
  static getStats = asyncHandler(async (req, res) => {
    const result = await DashboardProfessionnelService.getStats({ utilisateurConnecte: req.user });
    res.status(200).json(result);
  });
}
module.exports = DashboardProfessionnelController;
