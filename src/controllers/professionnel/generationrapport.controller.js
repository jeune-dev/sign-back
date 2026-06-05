const GestionDocumentService = require('../../services/professionnel/generationrapport.service');

exports.creerDocument = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;

    const {
      clientId,
      delais_execution,
      date_execution,
      avance,
      tva,
      lieu_execution,
      moyen_paiement,
      items
    } = req.body;

    // Appel du service
    const result = await GestionDocumentService.creerDocument({
      clientId,
      delais_execution,
      date_execution,
      avance,
      tva,
      lieu_execution,
      moyen_paiement,
      items,
      utilisateurConnecte
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || result.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Document créé avec succès',
      data: {
        documentId: result.data.documentId,
        numero_facture: result.data.numero_facture
      }

    });


  } catch (error) {
    console.error('❌ Erreur création document :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du document'
    });
  }
};

exports.getMesDocuments = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;

    const result = await GestionDocumentService.getMesDocuments({
      utilisateurConnecte,
      page: req.query.page,
      limit: req.query.limit
    });

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
    console.error('❌ Erreur controller getMesDocuments:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

exports.telechargerDocument = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;
    const { documentId } = req.params;

    const result = await GestionDocumentService.telechargerDocument({
      documentId,
      utilisateurConnecte
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    const { pdfBuffer, numero_facture } = result.data;

    // Vérifier que le buffer n'est pas vide
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Le fichier PDF est vide ou corrompu'
      });
    }

    // Nettoyer le nom du fichier
    const safeName = numero_facture.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `facture_${safeName}.pdf`;

    // Définir les headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur téléchargement document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

exports.ouvrirDocument = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;
    const { documentId } = req.params;

    const result = await GestionDocumentService.ouvrirDocument({
      documentId,
      utilisateurConnecte
    });

    if (!result || !result.success) {
      return res.status(404).json({
        success: false,
        message: result?.error || 'Document introuvable'
      });
    }

    const { pdfBuffer, numero_facture } = result.data;

    if (!pdfBuffer) {
      return res.status(500).json({
        success: false,
        message: 'PDF vide'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${numero_facture}.pdf"`
    );

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ CONTROLLER ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
