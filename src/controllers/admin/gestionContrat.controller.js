const GestionContratService = require('../../services/admin/gestionContrat.service');

// -------------------- NOMBRE DE CONTRATS --------------------
exports.nombreContrats = async (req, res) => {
  try {
    const result = await GestionContratService.nombreTotalContrats();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans nombreContrats :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des contrats"
    });
  }
};

// -------------------- CONSULTER UN CONTRAT --------------------
exports.consulterContrat = async (req, res) => {
  try {
    const { type, id } = req.params;
    const result = await GestionContratService.consulterContrat(type, id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans consulterContrat :", error);
    return res.status(404).json({
      message: 'Contrat introuvable'
    });
  }
};

// -------------------- LISTE DE TOUS LES CONTRATS --------------------
exports.listeContrats = async (req, res) => {
  try {
    const result = await GestionContratService.listeContrats({
      page:  req.query.page,
      limit: req.query.limit
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success:    true,
      contrats:   result.contrats,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Erreur dans listeContrats :", error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
