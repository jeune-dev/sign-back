'use strict';
const GestionContratService = require('../../services/admin/gestionContrat.service');
const { resolvePdfBuffer } = require('../../services/r2.service');
const asyncHandler = require('../../middlewares/asyncHandler');
const { NotFoundError } = require('../../errors/AppError');
exports.nombreContrats = asyncHandler(async (req, res) => {
  const result = await GestionContratService.nombreTotalContrats();
  res.status(200).json({ success: true, message: result.message, data: { total: result.totalContrats } });
});
exports.consulterContrat = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const result = await GestionContratService.consulterContrat(type, id);
  res.status(200).json({ success: true, message: result.message, data: { contrat: result.contrat } });
});
exports.telechargerContratPdf = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const result = await GestionContratService.consulterContrat(type, id);
  const contrat = result && result.contrat;
  const cle = contrat && contrat.contrat_pdf;
  if (!cle) throw new NotFoundError('Aucun PDF disponible pour ce contrat');
  const buffer = await resolvePdfBuffer(cle);
  if (!buffer || !buffer.length) throw new NotFoundError('PDF introuvable');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="' + (contrat.numero_contrat || 'contrat') + '.pdf"');
  res.send(buffer);
});
exports.listeContrats = asyncHandler(async (req, res) => {
  const result = await GestionContratService.listeContrats({ page: req.query.page, limit: req.query.limit });
  res.status(200).json({ success: true, message: 'Liste des contrats', data: { contrats: result.contrats, pagination: result.pagination } });
});
