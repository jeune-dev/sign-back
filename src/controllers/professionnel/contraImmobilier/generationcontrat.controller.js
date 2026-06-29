'use strict';
const GestionContratService = require('../../../services/professionnel/contratImmobilier/generationcontrat.service');
const asyncHandler = require('../../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../../errors/AppError');

exports.creerContrat = asyncHandler(async (req, res) => {
  const { locatairesIds, bien, bail, paiement, depot_garantie, clauses, signature, signature_bailleur } = req.body;
  const result = await GestionContratService.creerContrat({ utilisateurConnecte: req.user, locatairesIds, bien, bail, paiement, depot_garantie, clauses, signature, signature_bailleur });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(201).json({ success: true, message: 'Contrat de bail cree avec succes', data: { contratId: result.data.contratId, numero_contrat: result.data.numero_contrat, nombreLocataires: result.data.nombreLocataires } });
});

exports.getMesContrats = asyncHandler(async (req, res) => {
  const result = await GestionContratService.getMesContrats({ utilisateurConnecte: req.user, page: req.query.page, limit: req.query.limit });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, data: result.data });
});

exports.getContratById = asyncHandler(async (req, res) => {
  const result = await GestionContratService.getContratById({ contratId: req.params.id, utilisateurConnecte: req.user });
  if (!result.success) throw new NotFoundError(result.message);
  res.status(200).json({ success: true, data: result.data });
});

exports.getStats = asyncHandler(async (req, res) => {
  const result = await GestionContratService.getStats({ utilisateurConnecte: req.user });
  res.status(200).json({ success: true, data: result.data });
});

exports.telechargerContrat = asyncHandler(async (req, res) => {
  const result = await GestionContratService.telechargerContrat({ contratId: req.params.id, utilisateurConnecte: req.user });
  if (!result.success) throw new NotFoundError(result.message);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="contrat-bail-' + result.data.numero_contrat + '.pdf"');
  res.send(result.data.pdfBuffer);
});

exports.signerContrat = asyncHandler(async (req, res) => {
  const result = await GestionContratService.signerContrat({ contratId: req.params.id, utilisateurConnecte: req.user, signature: req.body.signature });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: result.message, data: result.data });
});

exports.resilierContrat = asyncHandler(async (req, res) => {
  const result = await GestionContratService.resilierContrat({ contratId: req.params.id, utilisateurConnecte: req.user, ...req.body });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: result.message, data: result.data });
});
