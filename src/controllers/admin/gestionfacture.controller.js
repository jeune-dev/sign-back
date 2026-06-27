const GestionFactureService = require('../../services/admin/gestionfacture.service');
const { resolvePdfBuffer } = require('../../services/r2.service');
const logger = require('../../utils/logger');

// -------------------- NOMBRE DE FACTURES --------------------
exports.nombreFactures = async (req, res) => {
  try {
    const result = await GestionFactureService.nombreTotalFactures();
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur dans nombreFactures :", error);
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
    logger.error("Erreur dans consulterFacture :", error);
    return res.status(404).json({
      message: 'Facture introuvable'
    });
  }
};

// -------------------- TÉLÉCHARGEMENT / APERÇU DU PDF --------------------
exports.telechargerFacturePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GestionFactureService.consulterFacture(id);
    const facture = result?.facture;
    const cle = facture?.document_pdf;

    if (!cle) {
      return res.status(404).json({ message: 'Aucun PDF disponible pour cette facture' });
    }

    const buffer = await resolvePdfBuffer(cle);
    if (!buffer || !buffer.length) {
      return res.status(404).json({ message: 'PDF introuvable' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${(facture.numero_facture || 'facture')}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('Erreur dans telechargerFacturePdf :', error);
    return res.status(500).json({ message: 'Impossible de récupérer le PDF de la facture' });
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
    logger.error('❌ Erreur controller getMesDocuments:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};