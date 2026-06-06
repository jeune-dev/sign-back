const GestionContratTravailService = require('../../../services/professionnel/contratTravail/contratTravail.service');

class ContratTravailController {

  // ============================================================
  // 🔹 CRÉER CONTRAT
  // ============================================================
  static async creerContrat(req, res) {
    try {

      const utilisateurConnecte = req.user; // middleware auth obligatoire

      const { salarieId, data, signature_employeur } = req.body;

      const result = await GestionContratTravailService.creerContratTravail({
        utilisateurConnecte,
        salarieId,
        data,
        signature_employeur
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // ============================================================
  // 🔹 SIGNER CONTRAT
  // ============================================================
  static async signerContrat(req, res) {
    try {

      const utilisateurConnecte = req.user;
      const { contratId } = req.params;
      const { signature } = req.body;

      const result = await GestionContratTravailService.signerContrat({
        contratId,
        utilisateurConnecte,
        signature
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // ============================================================
  // 🔹 DÉTAIL CONTRAT
  // ============================================================
  static async getContrat(req, res) {
    try {

      const utilisateurConnecte = req.user;
      const { contratId } = req.params;

      const result = await GestionContratTravailService.getContratTravailById({
        contratId,
        utilisateurConnecte
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // ============================================================
  // 🔹 MES CONTRATS
  // ============================================================
  static async getMesContrats(req, res) {
    try {

      const utilisateurConnecte = req.user;

      const result = await GestionContratTravailService.getMesContrats({
        utilisateurConnecte,
        page: req.query.page,
        limit: req.query.limit
      });

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerContrat(req, res) {
    try {

      const { contratId } = req.params;

      const result = await GestionContratTravailService.telechargerContrat({
        contratId
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      const { pdfBuffer, numero_contrat } = result.data;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=contrat-${numero_contrat}.pdf`
      );

      return res.send(pdfBuffer);

    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  static async getStats(req, res) {
    try {
      const result = await GestionContratTravailService.getStats({ utilisateurConnecte: req.user });
      if (!result.success) return res.status(400).json({ success: false, message: result.error });
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = ContratTravailController;