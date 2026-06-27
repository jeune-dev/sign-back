'use strict';
const ParticulierDashboardService = require('../../services/particulier/dashboard.service');
const asyncHandler = require('../../middlewares/asyncHandler');
class ParticulierDashboardController {
  static getStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const stats  = await ParticulierDashboardService.getStats(userId);
    const recent = await ParticulierDashboardService.getRecentesFactures(userId);
    res.status(200).json({ success: true, data: { stats, recentesFactures: recent } });
  });
}
module.exports = ParticulierDashboardController;
