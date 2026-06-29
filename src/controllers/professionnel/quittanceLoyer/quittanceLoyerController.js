'use strict';
const GestionQuittanceLoyerService = require('../../../services/professionnel/quittanceLoyer/quittanceLoyer.service');
const asyncHandler = require('../../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../../errors/AppError');

class QuittanceLoyerController {
  static creerQuittance = asyncHandler(async (req, res) => {
    const { locataireId, logementId, data, signature_bailleur } = req.body;
    const result = await GestionQuittanceLoyerService.creerQuittanceLoyer({ utilisateurConnecte: req.user, locataireId, logementId, data, signature_bailleur });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(201).json(result);
  });
  static getMesQuittances = asyncHandler(async (req, res) => {
    const result = await GestionQuittanceLoyerService.getMesQuittances({ utilisateurConnecte: req.user, page: req.query.page, limit: req.query.limit });
    res.status(200).json(result);
  });
  static getQuittance = asyncHandler(async (req, res) => {
    const result = await GestionQuittanceLoyerService.getQuittanceById({ quittanceId: req.params.quittanceId, utilisateurConnecte: req.user });
    if (!result.success) throw new NotFoundError(result.message);
    res.status(200).json(result);
  });
  static telechargerQuittance = asyncHandler(async (req, res) => {
    const result = await GestionQuittanceLoyerService.telechargerQuittance({ quittanceId: req.params.quittanceId });
    if (!result.success) throw new NotFoundError(result.message);
    const { pdfBuffer, numero_quittance } = result.data;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="quittance-' + numero_quittance + '.pdf"');
    res.send(pdfBuffer);
  });
}
module.exports = QuittanceLoyerController;
