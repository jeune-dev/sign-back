'use strict';
const GestionFactureService = require('../../services/admin/gestionfacture.service');
const { resolvePdfBuffer } = require('../../services/r2.service');
const asyncHandler = require('../../middlewares/asyncHandler');
const { NotFoundError } = require('../../errors/AppError');
exports.nombreFactures = asyncHandler(async (req, res) => {
  const result = await GestionFactureService.nombreTotalFactures();
  res.status(200).json({ success: true, message: result.message, data: { total: result.totalFactures } });
});
exports.consulterFacture = asyncHandler(async (req, res) => {
  const result = await GestionFactureService.consulterFacture(req.params.id);
  res.status(200).json({ success: true, message: result.message, data: { facture: result.facture } });
});
exports.telechargerFacturePdf = asyncHandler(async (req, res) => {
  const result = await GestionFactureService.consulterFacture(req.params.id);
  const facture = result && result.facture;
  const cle = facture && facture.document_pdf;
  if (!cle) throw new NotFoundError('Aucun PDF disponible pour cette facture');
  const buffer = await resolvePdfBuffer(cle);
  if (!buffer || !buffer.length) throw new NotFoundError('PDF introuvable');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="' + (facture.numero_facture || 'facture') + '.pdf"');
  res.send(buffer);
});
exports.listeFacture = asyncHandler(async (req, res) => {
  const result = await GestionFactureService.listeFacture({ page: req.query.page, limit: req.query.limit });
  res.status(200).json({ success: true, message: 'Liste des factures', data: { factures: result.factures, pagination: result.pagination } });
});
