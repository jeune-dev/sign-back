const EtatDesLieuxService = require('../../../services/professionnel/etatLogement/etatLogement.service');
const logger = require('../../../utils/logger');

class EtatDesLieuxController {

  // ============================================================
  // 🔹 CRÉER ÉTAT DES LIEUX
  // ============================================================
  static async creerEtatDesLieux(req, res) {
    try {

      const utilisateurConnecte = req.user;
      const { contratId } = req.params;

      // ✅ FIX IMPORTANT : on envoie tout le body comme data
      const data = req.body;
      const { signature_bailleur } = req.body;

      const result = await EtatDesLieuxService.creerEtatDesLieux({
        utilisateurConnecte,
        contratId,
        data,
        signature_bailleur
      });

      return res.status(result.success ? 201 : 400).json(result);

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

  // ============================================================
  // 🔹 SIGNER ÉTAT DES LIEUX (LOCATAIRE)
  // ============================================================
  static async signerEtatDesLieux(req, res) {
    try {

      const utilisateurConnecte = req.user;
      const { etatId } = req.params;
      const { signature } = req.body;

      const result = await EtatDesLieuxService.signerEtatDesLieux({
        etatId,
        utilisateurConnecte,
        signature
      });

      return res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

  // ============================================================
  // 🔹 DÉTAIL ÉTAT DES LIEUX
  // ============================================================
  static async getEtatDesLieux(req, res) {
    try {

      const { etatId } = req.params;

      const result = await EtatDesLieuxService.getEtatDesLieuxById({
        etatId
      });

      return res.status(result.success ? 200 : 404).json(result);

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

  // ============================================================
  // 🔹 MES ÉTATS DES LIEUX
  // ============================================================
  static async getMesEtatsDesLieux(req, res) {
    try {

      const utilisateurConnecte = req.user;

      const result = await EtatDesLieuxService.getMesEtatsDesLieux({
        utilisateurConnecte
      });

      return res.status(200).json(result);

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

  // ============================================================
  // 🔹 AJOUT / MISE À JOUR PIÈCES
  // ============================================================
  static async enregistrerPieces(req, res) {
    try {

      const utilisateurConnecte = req.user;
      const { etatId } = req.params;
      const { pieces } = req.body;

      const result = await EtatDesLieuxService.enregistrerPieces({
        etatId,
        utilisateurConnecte,
        pieces
      });

      return res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerEtatDesLieux(req, res) {
    try {

      const { etatId } = req.params;

      const result = await EtatDesLieuxService.telechargerEtatDesLieux({
        etatId
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${result.data.numero}.pdf`
      );

      return res.send(result.data.pdfBuffer);

    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

}

module.exports = EtatDesLieuxController;