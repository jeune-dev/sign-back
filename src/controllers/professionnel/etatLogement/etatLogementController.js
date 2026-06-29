'use strict';
const EtatDesLieuxService = require('../../../services/professionnel/etatLogement/etatLogement.service');
const asyncHandler = require('../../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../../errors/AppError');

class EtatDesLieuxController {
  static creerEtatDesLieux = asyncHandler(async (req, res) => {
    const result = await EtatDesLieuxService.creerEtatDesLieux({ utilisateurConnecte: req.user, contratId: req.params.contratId, data: req.body, signature_bailleur: req.body.signature_bailleur });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(201).json(result);
  });
  static signerEtatDesLieux = asyncHandler(async (req, res) => {
    const result = await EtatDesLieuxService.signerEtatDesLieux({ etatId: req.params.etatId, utilisateurConnecte: req.user, signature: req.body.signature });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json(result);
  });
  static getEtatDesLieux = asyncHandler(async (req, res) => {
    const result = await EtatDesLieuxService.getEtatDesLieuxById({ etatId: req.params.etatId });
    if (!result.success) throw new NotFoundError(result.message);
    res.status(200).json(result);
  });
  static getMesEtatsDesLieux = asyncHandler(async (req, res) => {
    const result = await EtatDesLieuxService.getMesEtatsDesLieux({ utilisateurConnecte: req.user });
    res.status(200).json(result);
  });
  static enregistrerPieces = asyncHandler(async (req, res) => {
    const result = await EtatDesLieuxService.enregistrerPieces({ etatId: req.params.etatId, utilisateurConnecte: req.user, pieces: req.body.pieces });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json(result);
  });
  static telechargerEtatDesLieux = asyncHandler(async (req, res) => {
    const result = await EtatDesLieuxService.telechargerEtatDesLieux({ etatId: req.params.etatId });
    if (!result.success) throw new NotFoundError(result.message);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + result.data.numero + '.pdf');
    res.send(result.data.pdfBuffer);
  });
}
module.exports = EtatDesLieuxController;
