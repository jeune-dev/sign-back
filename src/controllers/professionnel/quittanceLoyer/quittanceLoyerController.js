const GestionQuittanceLoyerService = require('../../../services/professionnel/quittanceLoyer/quittanceLoyer.service');
const logger = require('../../../utils/logger');

class QuittanceLoyerController {

  // ============================================================
  // 🔹 CRÉER QUITTANCE
  // ============================================================
  static async creerQuittance(req, res) {
    try {

      const utilisateurConnecte = req.user;

      const {
        locataireId,
        logementId,
        data,
        signature_bailleur
      } = req.body;

      const result = await GestionQuittanceLoyerService.creerQuittanceLoyer({
        utilisateurConnecte,
        locataireId,
        logementId,
        data,
        signature_bailleur
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // ============================================================
  // 🔹 MES QUITTANCES (BAILLEUR)
  // ============================================================
  static async getMesQuittances(req, res) {
    try {

      const utilisateurConnecte = req.user;

      const result = await GestionQuittanceLoyerService.getMesQuittances({
        utilisateurConnecte,
        page: req.query.page,
        limit: req.query.limit
      });

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // ============================================================
  // 🔹 DÉTAIL QUITTANCE
  // ============================================================
  static async getQuittance(req, res) {
    try {

      const utilisateurConnecte = req.user;
      const { quittanceId } = req.params;

      const result = await GestionQuittanceLoyerService.getQuittanceById({
        quittanceId,
        utilisateurConnecte
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerQuittance(req, res) {
    try {

      const { quittanceId } = req.params;

      const result = await GestionQuittanceLoyerService.telechargerQuittance({
        quittanceId
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      const { pdfBuffer, numero_quittance } = result.data;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=quittance-${numero_quittance}.pdf`
      );

      return res.send(pdfBuffer);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
}

module.exports = QuittanceLoyerController;