const ContratPrestationService = require('../../../../services/professionnel/autresContrats/contratPrestation/contratPrestation.service');

class ContratPrestationController {

  static async creerContrat(req, res) {
    try {
      const utilisateurConnecte = req.user;
      const { autrePartieId, data, signature_generateur } = req.body;
      const result = await ContratPrestationService.creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur });
      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async signerContrat(req, res) {
    try {
      const utilisateurConnecte = req.user;
      const { contratId } = req.params;
      const { signature } = req.body;
      const result = await ContratPrestationService.signerContrat({ contratId, utilisateurConnecte, signature });
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getContrat(req, res) {
    try {
      const utilisateurConnecte = req.user;
      const { contratId } = req.params;
      const result = await ContratPrestationService.getContratById({ contratId, utilisateurConnecte });
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMesContrats(req, res) {
    try {
      const utilisateurConnecte = req.user;
      const result = await ContratPrestationService.getMesContrats({ utilisateurConnecte });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async telechargerContrat(req, res) {
    try {
      const { contratId } = req.params;
      const result = await ContratPrestationService.telechargerContrat({ contratId });
      if (!result.success) return res.status(404).json(result);
      const { pdfBuffer, numero_contrat } = result.data;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=prestation-${numero_contrat}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ContratPrestationController;
