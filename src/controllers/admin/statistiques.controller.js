const StatistiquesService = require('../../services/admin/statistiques.service');
const logger = require('../../utils/logger');

// -------------------- STATISTIQUES GLOBALES DU DASHBOARD --------------------
exports.statistiques = async (req, res) => {
  try {
    const result = await StatistiquesService.getStatistiques();
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erreur dans statistiques :', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors du calcul des statistiques',
    });
  }
};
