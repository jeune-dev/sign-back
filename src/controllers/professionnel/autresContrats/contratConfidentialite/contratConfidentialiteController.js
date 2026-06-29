'use strict';
const ContratConfidentialiteService = require('../../../../services/professionnel/autresContrats/contratConfidentialite/contratConfidentialite.service');
const asyncHandler = require('../../../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../../../errors/AppError');

class ContratConfidentialiteController {
  static creerContrat = asyncHandler(async (req, res) => {
    const { autrePartieId, data, signature_generateur } = req.body;
    const result = await ContratConfidentialiteService.creerContrat({ utilisateurConnecte: req.user, autrePartieId, data, signature_generateur });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(201).json(result);
  });
  static signerContrat = asyncHandler(async (req, res) => {
    const result = await ContratConfidentialiteService.signerContrat({ contratId: req.params.contratId, utilisateurConnecte: req.user, signature: req.body.signature });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json(result);
  });
  static getContrat = asyncHandler(async (req, res) => {
    const result = await ContratConfidentialiteService.getContratById({ contratId: req.params.contratId, utilisateurConnecte: req.user });
    if (!result.success) throw new NotFoundError(result.message);
    res.status(200).json(result);
  });
  static getMesContrats = asyncHandler(async (req, res) => {
    const result = await ContratConfidentialiteService.getMesContrats({ utilisateurConnecte: req.user });
    res.status(200).json(result);
  });
  static telechargerContrat = asyncHandler(async (req, res) => {
    const result = await ContratConfidentialiteService.telechargerContrat({ contratId: req.params.contratId });
    if (!result.success) throw new NotFoundError(result.message);
    const { pdfBuffer, numero_contrat } = result.data;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contratConfidentialite-' + numero_contrat + '.pdf"');
    res.send(pdfBuffer);
  });
  static getStats = asyncHandler(async (req, res) => {
    const result = await ContratConfidentialiteService.getStats({ utilisateurConnecte: req.user });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json({ success: true, data: result.data });
  });
}
module.exports = ContratConfidentialiteController;
