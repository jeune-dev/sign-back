'use strict';
const ParticulierContratsService = require('../../services/particulier/contrats.service');
const asyncHandler = require('../../middlewares/asyncHandler');
const { NotFoundError, BadRequestError } = require('../../errors/AppError');
class ParticulierContratsController {
  static getTousContrats = asyncHandler(async (req, res) => {
    const contrats = await ParticulierContratsService.getTousContrats({ userId: req.user.id, statut: req.query.statut });
    res.status(200).json({ success: true, data: { contrats, total: contrats.length } });
  });
  static getContratsByType = asyncHandler(async (req, res) => {
    const { statut, page = 1, limit = 20 } = req.query;
    const result = await ParticulierContratsService.getContratsByType({ userId: req.user.id, type: req.params.type, statut, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    res.status(200).json({ success: true, data: result });
  });
  static getContratDetail = asyncHandler(async (req, res) => {
    const contrat = await ParticulierContratsService.getContratDetail({ userId: req.user.id, type: req.params.type, contratId: req.params.contratId });
    if (!contrat) throw new NotFoundError('Contrat introuvable');
    res.status(200).json({ success: true, data: { contrat } });
  });
  static signerContrat = asyncHandler(async (req, res) => {
    const result = await ParticulierContratsService.signerContrat({ userId: req.user.id, type: req.params.type, contratId: req.params.contratId, signature: req.body.signature });
    if (!result.success) throw new BadRequestError(result.message);
    res.status(200).json({ success: true, message: 'Contrat signe avec succes', data: result.contrat });
  });
  static getPdf = asyncHandler(async (req, res) => {
    const result = await ParticulierContratsService.getPdf({ userId: req.user.id, type: req.params.type, contratId: req.params.contratId });
    if (!result) throw new NotFoundError('PDF introuvable');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contrat_' + result.numero_contrat + '.pdf"');
    res.send(result.pdfBuffer);
  });
}
module.exports = ParticulierContratsController;
