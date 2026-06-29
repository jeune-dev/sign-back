'use strict';
const ParticulierFacturesService = require('../../services/particulier/factures.service');
const asyncHandler = require('../../middlewares/asyncHandler');
const { NotFoundError } = require('../../errors/AppError');
class ParticulierFacturesController {
  static getFactures = asyncHandler(async (req, res) => {
    const { statut, page = 1, limit = 20 } = req.query;
    const result = await ParticulierFacturesService.getFactures({ userId: req.user.id, statut, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    res.status(200).json({ success: true, data: result });
  });
  static getFactureDetail = asyncHandler(async (req, res) => {
    const facture = await ParticulierFacturesService.getFactureDetail({ userId: req.user.id, factureId: req.params.factureId });
    if (!facture) throw new NotFoundError('Facture introuvable');
    res.status(200).json({ success: true, data: { facture } });
  });
}
module.exports = ParticulierFacturesController;
