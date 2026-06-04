const ContratConfidentialiteService = require('../../../../services/professionnel/autresContrats/contratConfidentialite/contratConfidentialite.service');

class ContratConfidentialiteController {

  static async creerContrat(req, res) {
    try {
      const { autrePartieId, data, signature_generateur } = req.body;
      const result = await ContratConfidentialiteService.creerContrat({ utilisateurConnecte: req.user, autrePartieId, data, signature_generateur });
      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async signerContrat(req, res) {
    try {
      const result = await ContratConfidentialiteService.signerContrat({ contratId: req.params.contratId, utilisateurConnecte: req.user, signature: req.body.signature });
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getContrat(req, res) {
    try {
      const result = await ContratConfidentialiteService.getContratById({ contratId: req.params.contratId, utilisateurConnecte: req.user });
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMesContrats(req, res) {
    try {
      const result = await ContratConfidentialiteService.getMesContrats({ utilisateurConnecte: req.user });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async telechargerContrat(req, res) {
    try {
      const result = await ContratConfidentialiteService.telechargerContrat({ contratId: req.params.contratId });
      if (!result.success) return res.status(404).json(result);
      const { pdfBuffer, numero_contrat } = result.data;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=confidentialite-${numero_contrat}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ContratConfidentialiteController;
