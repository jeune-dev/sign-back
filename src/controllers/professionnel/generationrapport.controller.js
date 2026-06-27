'use strict';
const GestionDocumentService = require('../../services/professionnel/generationrapport.service');
const asyncHandler = require('../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../errors/AppError');
exports.creerDocument = asyncHandler(async (req, res) => {
  const { clientId, delais_execution, date_execution, avance, montant_paye, tva, lieu_execution, moyen_paiement, items } = req.body;
  const result = await GestionDocumentService.creerDocument({ clientId, delais_execution, date_execution, avance, montant_paye, tva, lieu_execution, moyen_paiement, items, utilisateurConnecte: req.user });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(201).json({ success: true, message: 'Document cree avec succes', data: { documentId: result.data.documentId, numero_facture: result.data.numero_facture } });
});
exports.getMesDocuments = asyncHandler(async (req, res) => {
  const result = await GestionDocumentService.getMesDocuments({ utilisateurConnecte: req.user, page: req.query.page, limit: req.query.limit });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, data: result.data });
});
exports.telechargerDocument = asyncHandler(async (req, res) => {
  const result = await GestionDocumentService.telechargerDocument({ documentId: req.params.documentId, utilisateurConnecte: req.user });
  if (!result.success) throw new NotFoundError(result.message);
  const { pdfBuffer, numero_facture } = result.data;
  if (!pdfBuffer || !pdfBuffer.length) throw new NotFoundError('Le fichier PDF est vide ou corrompu');
  const safeName = numero_facture.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="facture_' + safeName + '.pdf"', 'Content-Length': pdfBuffer.length, 'Cache-Control': 'no-cache, no-store, must-revalidate' });
  res.send(pdfBuffer);
});
exports.ouvrirDocument = asyncHandler(async (req, res) => {
  const result = await GestionDocumentService.ouvrirDocument({ documentId: req.params.documentId, utilisateurConnecte: req.user });
  if (!result || !result.success) throw new NotFoundError((result && result.error) || 'Document introuvable');
  const { pdfBuffer, numero_facture } = result.data;
  if (!pdfBuffer) throw new NotFoundError('PDF vide');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="' + numero_facture + '.pdf"');
  res.send(pdfBuffer);
});
exports.renvoyerFacture = asyncHandler(async (req, res) => {
  const result = await GestionDocumentService.renvoyerFacture({ documentId: req.params.id, professionnelId: req.user.id });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: result.message });
});
exports.mettreAJourFacture = asyncHandler(async (req, res) => {
  const { avance, statut } = req.body;
  const result = await GestionDocumentService.mettreAJourFacture({ documentId: req.params.id, professionnelId: req.user.id, avance, statut });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: 'Facture mise a jour', data: result.data });
});
