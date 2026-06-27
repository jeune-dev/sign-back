const GestionContratService = require('../../services/admin/gestionContrat.service');
const { resolvePdfBuffer } = require('../../services/r2.service');
const logger = require('../../utils/logger');

exports.nombreContrats = async (req, res) => {
  try {
    const result = await GestionContratService.nombreTotalContrats();
    return res.status(200).json({ success: true, message: result.message, data: { total: result.totalContrats } });
  } catch (error) {
    logger.error('Erreur dans nombreContrats :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du comptage des contrats' });
  }
};

exports.consulterContrat = async (req, res) => {
  try {
    const { type, id } = req.params;
    const result = await GestionContratService.consulterContrat(type, id);
    return res.status(200).json({ success: true, message: result.message, data: { contrat: result.contrat } });
  } catch (error) {
    logger.error('Erreur dans consulterContrat :', error);
    return res.status(404).json({ success: false, message: error.message || 'Contrat introuvable' });
  }
};

exports.telechargerContratPdf = async (req, res) => {
  try {
    const { type, id } = req.params;
    const result = await GestionContratService.consulterContrat(type, id);
    const contrat = result?.contrat;
    const cle = contrat?.contrat_pdf;
    if (!cle) return res.status(404).json({ success: false, message: 'Aucun PDF disponible pour ce contrat' });
    const buffer = await resolvePdfBuffer(cle);
    if (!buffer || !buffer.length) return res.status(404).json({ success: false, message: 'PDF introuvable' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${(contrat.numero_contrat || 'contrat')}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('Erreur dans telechargerContratPdf :', error);
    return res.status(500).json({ success: false, message: 'Impossible de récupérer le PDF du contrat' });
  }
};

exports.listeContrats = async (req, res) => {
  try {
    const result = await GestionContratService.listeContrats({ page: req.query.page, limit: req.query.limit });
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    return res.status(200).json({ success: true, message: 'Liste des contrats', data: { contrats: result.contrats, pagination: result.pagination } });
  } catch (error) {
    logger.error('Erreur dans listeContrats :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
