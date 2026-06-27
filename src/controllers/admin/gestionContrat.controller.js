const GestionContratService = require('../../services/admin/gestionContrat.service');
const { resolvePdfBuffer } = require('../../services/r2.service');
const logger = require('../../utils/logger');

// -------------------- NOMBRE DE CONTRATS --------------------
exports.nombreContrats = async (req, res) => {
  try {
    const result = await GestionContratService.nombreTotalContrats();
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur dans nombreContrats :", error);
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
    logger.error("Erreur dans consulterContrat :", error);
    return res.status(404).json({
      message: 'Contrat introuvable'
    });
  }
};

// -------------------- TÉLÉCHARGEMENT / APERÇU DU PDF --------------------
exports.telechargerContratPdf = async (req, res) => {
  try {
    const { type, id } = req.params;
    const result = await GestionContratService.consulterContrat(type, id);
    const contrat = result?.contrat;
    const cle = contrat?.contrat_pdf;

    if (!cle) {
      return res.status(404).json({ message: 'Aucun PDF disponible pour ce contrat' });
    }

    const buffer = await resolvePdfBuffer(cle);
    if (!buffer || !buffer.length) {
      return res.status(404).json({ message: 'PDF introuvable' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${(contrat.numero_contrat || 'contrat')}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('Erreur dans telechargerContratPdf :', error);
    return res.status(500).json({ message: 'Impossible de récupérer le PDF du contrat' });
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
    logger.error("Erreur dans listeContrats :", error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
