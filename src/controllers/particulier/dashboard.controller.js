'use strict';

const ParticulierDashboardService = require('../../services/particulier/dashboard.service');
const logger = require('../../utils/logger');

class ParticulierDashboardController {

  // GET /sign/particulier/dashboard/stats
  static async getStats(req, res) {
    try {
      const userId = req.user.id;
      const stats  = await ParticulierDashboardService.getStats(userId);
      const recent = await ParticulierDashboardService.getRecentesFactures(userId);

      return res.status(200).json({
        success: true,
        data: {
          stats,
          recentesFactures: recent,
        },
      });
    } catch (err) {
      logger.error('[ParticulierDashboard] getStats error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }
}

module.exports = ParticulierDashboardController;
