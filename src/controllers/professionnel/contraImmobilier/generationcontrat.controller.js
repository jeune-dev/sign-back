const GestionContratService = require('../../../services/professionnel/contratImmobilier/generationcontrat.service');

// ============================================================
// 🔹 CRÉER UN CONTRAT DE BAIL
// POST /api/contrats
// ============================================================
exports.creerContrat = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;

    const {
      locatairesIds,
      bien,
      bail,
      paiement,
      depot_garantie,
      clauses,
      signature
    } = req.body;

    const result = await GestionContratService.creerContrat({
      utilisateurConnecte,
      locatairesIds,
      bien,
      bail,
      paiement,
      depot_garantie,
      clauses,
      signature
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || result.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Contrat de bail créé avec succès',
      data: {
        contratId:        result.data.contratId,
        numero_contrat:   result.data.numero_contrat,
        nombreLocataires: result.data.nombreLocataires
      }
    });

  } catch (error) {
    console.error('❌ Erreur création contrat :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du contrat',
    });
  }
};

// ============================================================
// 🔹 LISTER MES CONTRATS
// GET /api/contrats
// ============================================================
exports.getMesContrats = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;

    const result = await GestionContratService.getMesContrats({ utilisateurConnecte, page: req.query.page, limit: req.query.limit });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Erreur getMesContrats :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des contrats',
    });
  }
};

// ============================================================
// 🔹 DÉTAIL D'UN CONTRAT
// GET /api/contrats/:id
// ============================================================
exports.getContratById = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;
    const { id }              = req.params;

    const result = await GestionContratService.getContratById({
      contratId: id,
      utilisateurConnecte
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Erreur getContratById :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du contrat',
    });
  }
};

// ============================================================
// 🔹 TÉLÉCHARGER LE PDF D'UN CONTRAT
// GET /api/contrats/:id/telecharger
// ============================================================
exports.telechargerContrat = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;
    const { id }              = req.params;

    const result = await GestionContratService.telechargerContrat({
      contratId: id,
      utilisateurConnecte
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    const { pdfBuffer, numero_contrat } = result.data;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${numero_contrat}.pdf"`
    );

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur téléchargement contrat :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du téléchargement du contrat',
    });
  }
};

// ============================================================
// 🔹 SIGNER UN CONTRAT (locataire)
// POST /api/contrats/:id/signer
// ============================================================
exports.signerContrat = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;
    const { id }              = req.params;

    const result = await GestionContratService.signerContrat({
      contratId: id,
      utilisateurConnecte,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(200).json({ success: true, message: result.message });

  } catch (error) {
    console.error('❌ Erreur signature contrat :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la signature du contrat',
    });
  }
};

// ============================================================
// 🔹 RÉSILIER UN CONTRAT
// PATCH /api/contrats/:id/resilier
// ============================================================
exports.resilierContrat = async (req, res) => {
  try {
    const utilisateurConnecte   = req.user;
    const { id }                = req.params;
    const { motif_resiliation } = req.body;

    const result = await GestionContratService.resilierContrat({
      contratId: id,
      utilisateurConnecte,
      motif_resiliation
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Erreur résiliation contrat :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la résiliation du contrat',
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const result = await GestionContratService.getStats({ utilisateurConnecte: req.user });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};