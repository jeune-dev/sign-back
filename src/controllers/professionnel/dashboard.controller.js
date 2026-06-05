const DashboardProfessionnelService = require('../../services/professionnel/dashboard.service');

class DashboardProfessionnelController {

  static async getStats(req, res) {
    try {
      const result = await DashboardProfessionnelService.getStats({
        utilisateurConnecte: req.user
      });

      return res.status(200).json(result);

    } catch (error) {
      console.error('Erreur dashboard getStats:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

}

module.exports = DashboardProfessionnelController;
