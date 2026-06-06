const ContratPartenariatService = require('../../../../services/professionnel/autresContrats/contratPartenariat/contratPartenariat.service');

class ContratPartenariatController {

  static async creerContrat(req, res) {
    try {
      const utilisateurConnecte = req.user;
      const { autrePartieId, data, signature_generateur } = req.body;
      const result = await ContratPartenariatService.creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur });
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
      const result = await ContratPartenariatService.signerContrat({ contratId, utilisateurConnecte, signature });
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getContrat(req, res) {
    try {
      const utilisateurConnecte = req.user;
      const { contratId } = req.params;
      const result = await ContratPartenariatService.getContratById({ contratId, utilisateurConnecte });
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMesContrats(req, res) {
    try {
      const result = await ContratPartenariatService.getMesContrats({ utilisateurConnecte: req.user });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async telechargerContrat(req, res) {
    try {
      const result = await ContratPartenariatService.telechargerContrat({ contratId: req.params.contratId });
      if (!result.success) return res.status(404).json(result);
      const { pdfBuffer, numero_contrat } = result.data;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=partenariat-${numero_contrat}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStats(req, res) {
    try {
      const result = await ContratPartenariatService.getStats({ utilisateurConnecte: req.user });
      if (!result.success) return res.status(400).json({ success: false, message: result.error });
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
}

module.exports = ContratPartenariatController;
