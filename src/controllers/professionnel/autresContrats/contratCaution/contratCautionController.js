'use strict';
const ContratCautionService = require('../../../../services/professionnel/autresContrats/contratCaution/contratCaution.service');
const asyncHandler = require('../../../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../../../errors/AppError');

class ContratCautionController {
  static creerContrat = asyncHandler(async (req, res) => {
    const { autrePartieId, data, signature_generateur } = req.body;
    const result = await ContratCautionService.creerContrat({ utilisateurConnecte: req.user, autrePartieId, data, signature_generateur });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(201).json(result);
  });
  static signerContrat = asyncHandler(async (req, res) => {
    const result = await ContratCautionService.signerContrat({ contratId: req.params.contratId, utilisateurConnecte: req.user, signature: req.body.signature });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json(result);
  });
  static getContrat = asyncHandler(async (req, res) => {
    const result = await ContratCautionService.getContratById({ contratId: req.params.contratId, utilisateurConnecte: req.user });
    if (!result.success) throw new NotFoundError(result.message);
    res.status(200).json(result);
  });
  static getMesContrats = asyncHandler(async (req, res) => {
    const result = await ContratCautionService.getMesContrats({ utilisateurConnecte: req.user });
    res.status(200).json(result);
  });
  static telechargerContrat = asyncHandler(async (req, res) => {
    const result = await ContratCautionService.telechargerContrat({ contratId: req.params.contratId });
    if (!result.success) throw new NotFoundError(result.message);
    const { pdfBuffer, numero_contrat } = result.data;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contratCaution-' + numero_contrat + '.pdf"');
    res.send(pdfBuffer);
  });
  static getStats = asyncHandler(async (req, res) => {
    const result = await ContratCautionService.getStats({ utilisateurConnecte: req.user });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json({ success: true, data: result.data });
  });
}
module.exports = ContratCautionController;
