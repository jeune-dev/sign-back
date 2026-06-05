const GestionFactureService = require('../../services/admin/gestionfacture.service');

// -------------------- NOMBRE DE FACTURES --------------------
exports.nombreFactures = async (req, res) => {
  try {
    const result = await GestionFactureService.nombreTotalFactures();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans nombreFactures :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des factures"
    });
  }
};

exports.consulterFacture = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GestionFactureService.consulterFacture(id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans consulterFacture :", error);
    return res.status(404).json({
      message: 'Facture introuvable'
    });
  }
};

exports.listeFacture = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;

    const result = await GestionFactureService.listeFacture({ page: req.query.page, limit: req.query.limit });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      factures: result.factures
    });

  } catch (error) {
    console.error('❌ Erreur controller getMesDocuments:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};