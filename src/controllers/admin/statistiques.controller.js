const StatistiquesService = require('../../services/admin/statistiques.service');
const logger = require('../../utils/logger');

exports.statistiques = async (req, res) => {
  try {
    const result = await StatistiquesService.getStatistiques();
    return res.status(200).json({ success: true, message: 'Statistiques récupérées', data: result.stats });
  } catch (error) {
    logger.error('Erreur dans statistiques :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du calcul des statistiques' });
  }
};
