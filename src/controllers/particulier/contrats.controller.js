'use strict';

const ParticulierContratsService = require('../../services/particulier/contrats.service');
const logger = require('../../utils/logger');

class ParticulierContratsController {

  // GET /sign/particulier/contrats?statut=signe|en_attente
  static async getTousContrats(req, res) {
    try {
      const userId = req.user.id;
      const { statut } = req.query;

      const contrats = await ParticulierContratsService.getTousContrats({ userId, statut });
      return res.status(200).json({ success: true, data: { contrats, total: contrats.length } });
    } catch (err) {
      logger.error('[ParticulierContrats] getTousContrats error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }

  // GET /sign/particulier/contrats/:type?statut=signe|en_attente&page=1&limit=20
  static async getContratsByType(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.params;
      const { statut, page = 1, limit = 20 } = req.query;

      const result = await ParticulierContratsService.getContratsByType({
        userId,
        type,
        statut,
        page:  parseInt(page,  10),
        limit: parseInt(limit, 10),
      });

      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      logger.error('[ParticulierContrats] getContratsByType error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }

  // GET /sign/particulier/contrats/:type/:contratId
  static async getContratDetail(req, res) {
    try {
      const userId = req.user.id;
      const { type, contratId } = req.params;

      const contrat = await ParticulierContratsService.getContratDetail({ userId, type, contratId });
      if (!contrat) {
        return res.status(404).json({ success: false, message: 'Contrat introuvable' });
      }

      return res.status(200).json({ success: true, data: { contrat } });
    } catch (err) {
      logger.error('[ParticulierContrats] getContratDetail error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }

  // POST /sign/particulier/contrats/:type/:contratId/signer
  static async signerContrat(req, res) {
    try {
      const userId = req.user.id;
      const { type, contratId } = req.params;
      const { signature } = req.body;

      if (!signature) {
        return res.status(400).json({ success: false, message: 'Signature manquante' });
      }

      const result = await ParticulierContratsService.signerContrat({
        userId,
        type,
        contratId,
        signature,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, message: result.error });
      }

      return res.status(200).json({ success: true, data: result.contrat, message: 'Contrat signé avec succès' });
    } catch (err) {
      logger.error('[ParticulierContrats] signerContrat error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }
  // GET /sign/particulier/contrats/:type/:contratId/pdf
  static async getPdf(req, res) {
    try {
      const userId = req.user.id;
      const { type, contratId } = req.params;

      const result = await ParticulierContratsService.getPdf({ userId, type, contratId });
      if (!result) {
        return res.status(404).json({ success: false, message: 'PDF introuvable' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contrat_${result.numero_contrat}.pdf"`);
      return res.send(result.pdfBuffer);
    } catch (err) {
      logger.error('[ParticulierContrats] getPdf error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }
}

module.exports = ParticulierContratsController;
