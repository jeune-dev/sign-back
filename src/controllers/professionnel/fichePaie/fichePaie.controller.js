'use strict';
const Service = require('../../../services/professionnel/fichePaie/fichePaie.service');
const asyncHandler = require('../../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../../errors/AppError');

class FichePaieController {
  static creerFichePaie = asyncHandler(async (req, res) => {
    const result = await Service.creerFichePaie({ utilisateurConnecte: req.user, ...req.body });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(201).json(result);
  });
  static getMesFichesPaie = asyncHandler(async (req, res) => {
    const result = await Service.getMesFichesPaie({ utilisateurConnecte: req.user, page: req.query.page, limit: req.query.limit });
    res.status(200).json(result);
  });
  static getFichePaie = asyncHandler(async (req, res) => {
    const result = await Service.getFichePaieById({ fichePaieId: req.params.fichePaieId, utilisateurConnecte: req.user });
    if (!result.success) throw new NotFoundError(result.message);
    res.status(200).json(result);
  });
  static telechargerFichePaie = asyncHandler(async (req, res) => {
    const result = await Service.telechargerFichePaie({ fichePaieId: req.params.fichePaieId });
    if (!result.success || !result.data) throw new NotFoundError('Fiche ou PDF introuvable');
    const { pdfBuffer, numero_fiche } = result.data;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + numero_fiche + '.pdf"');
    res.send(pdfBuffer);
  });
}
module.exports = FichePaieController;
