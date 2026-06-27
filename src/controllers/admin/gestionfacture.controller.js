const GestionFactureService = require('../../services/admin/gestionfacture.service');
const { resolvePdfBuffer } = require('../../services/r2.service');
const logger = require('../../utils/logger');

exports.nombreFactures = async (req, res) => {
  try {
    const result = await GestionFactureService.nombreTotalFactures();
    return res.status(200).json({ success: true, message: result.message, data: { total: result.totalFactures } });
  } catch (error) {
    logger.error('Erreur dans nombreFactures :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du comptage des factures' });
  }
};

exports.consulterFacture = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GestionFactureService.consulterFacture(id);
    return res.status(200).json({ success: true, message: result.message, data: { facture: result.facture } });
  } catch (error) {
    logger.error('Erreur dans consulterFacture :', error);
    return res.status(404).json({ success: false, message: error.message || 'Facture introuvable' });
  }
};

exports.telechargerFacturePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GestionFactureService.consulterFacture(id);
    const facture = result?.facture;
    const cle = facture?.document_pdf;
    if (!cle) return res.status(404).json({ success: false, message: 'Aucun PDF disponible pour cette facture' });
    const buffer = await resolvePdfBuffer(cle);
    if (!buffer || !buffer.length) return res.status(404).json({ success: false, message: 'PDF introuvable' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${(facture.numero_facture || 'facture')}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('Erreur dans telechargerFacturePdf :', error);
    return res.status(500).json({ success: false, message: 'Impossible de récupérer le PDF de la facture' });
  }
};

exports.listeFacture = async (req, res) => {
  try {
    const result = await GestionFactureService.listeFacture({ page: req.query.page, limit: req.query.limit });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: 'Liste des factures', data: { factures: result.factures, pagination: result.pagination } });
  } catch (error) {
    logger.error('Erreur controller listeFacture:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
