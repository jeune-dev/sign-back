const Service = require('../../../services/professionnel/fichePaie/fichePaie.service');

class FichePaieController {

  static async creerFichePaie(req, res) {
    try {
      const result = await Service.creerFichePaie({
        utilisateurConnecte: req.user,
        ...req.body
      });

      return res.status(result.success ? 201 : 400).json(result);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  static async getMesFichesPaie(req, res) {
    try {
      const result = await Service.getMesFichesPaie({
        utilisateurConnecte: req.user,
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

  static async getFichePaie(req, res) {
    try {
      const result = await Service.getFichePaieById({
        fichePaieId: req.params.fichePaieId,
        utilisateurConnecte: req.user
      });

      return res.status(result.success ? 200 : 404).json(result);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // ==========================
  // DOWNLOAD PDF (CORRIGÉ)
  // ==========================
  static async telechargerFichePaie(req, res) {
    try {
      const result = await Service.telechargerFichePaie({
        fichePaieId: req.params.fichePaieId
      });

      if (!result.success || !result.data) {
        return res.status(404).json({
          success: false,
          message: "Fiche ou PDF introuvable"
        });
      }

      const { pdfBuffer, numero_fiche } = result.data;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${numero_fiche}.pdf"`
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

module.exports = FichePaieController;