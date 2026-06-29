'use strict';
const GestionContratTravailService = require('../../../services/professionnel/contratTravail/contratTravail.service');
const asyncHandler = require('../../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../../errors/AppError');

class ContratTravailController {
  static creerContrat = asyncHandler(async (req, res) => {
    const { salarieId, data, signature_employeur } = req.body;
    const result = await GestionContratTravailService.creerContratTravail({ utilisateurConnecte: req.user, salarieId, data, signature_employeur });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(201).json(result);
  });
  static signerContrat = asyncHandler(async (req, res) => {
    const result = await GestionContratTravailService.signerContrat({ contratId: req.params.contratId, utilisateurConnecte: req.user, signature: req.body.signature });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json(result);
  });
  static getContrat = asyncHandler(async (req, res) => {
    const result = await GestionContratTravailService.getContratTravailById({ contratId: req.params.contratId, utilisateurConnecte: req.user });
    if (!result.success) throw new NotFoundError(result.message);
    res.status(200).json(result);
  });
  static getMesContrats = asyncHandler(async (req, res) => {
    const result = await GestionContratTravailService.getMesContrats({ utilisateurConnecte: req.user, page: req.query.page, limit: req.query.limit });
    res.status(200).json(result);
  });
  static telechargerContrat = asyncHandler(async (req, res) => {
    const result = await GestionContratTravailService.telechargerContrat({ contratId: req.params.contratId });
    if (!result.success) throw new NotFoundError(result.message);
    const { pdfBuffer, numero_contrat } = result.data;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contrat-' + numero_contrat + '.pdf"');
    res.send(pdfBuffer);
  });
  static getStats = asyncHandler(async (req, res) => {
    const result = await GestionContratTravailService.getStats({ utilisateurConnecte: req.user });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json({ success: true, data: result.data });
  });
}
module.exports = ContratTravailController;
