'use strict';

const ParticulierFacturesService = require('../../services/particulier/factures.service');
const logger = require('../../utils/logger');

class ParticulierFacturesController {

  // GET /sign/particulier/factures?statut=signe|en_attente&page=1&limit=20
  static async getFactures(req, res) {
    try {
      const userId = req.user.id;
      const { statut, page = 1, limit = 20 } = req.query;

      const result = await ParticulierFacturesService.getFactures({
        userId,
        statut,
        page:  parseInt(page,  10),
        limit: parseInt(limit, 10),
      });

      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      logger.error('[ParticulierFactures] getFactures error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }

  // GET /sign/particulier/factures/:factureId
  static async getFactureDetail(req, res) {
    try {
      const userId    = req.user.id;
      const { factureId } = req.params;

      const facture = await ParticulierFacturesService.getFactureDetail({ userId, factureId });
      if (!facture) {
        return res.status(404).json({ success: false, message: 'Facture introuvable' });
      }

      return res.status(200).json({ success: true, data: { facture } });
    } catch (err) {
      logger.error('[ParticulierFactures] getFactureDetail error:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  }
}

module.exports = ParticulierFacturesController;
