const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const templateDocument = require('../../templates/pdf/document.template');

const templateEntreprise = require('../../templates/pdf/factureEntreprise.template');
const templateIndependant = require('../../templates/pdf/factureIndependant.template');
const { Op } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');

const envoyerDocumentEmail = require('../emailService');

class GestionDocumentService {

  // 🔹 GÉNÉRER NUMÉRO FACTURE
  static async genererNumeroFacture() {
    try {
      const annee = new Date().getFullYear();

      const dernierDocument = await Document.findOne({
        where: {
          numero_facture: { [Op.like]: `FAC-${annee}-%` }
        },
        order: [['createdAt', 'DESC']],
        attributes: ['numero_facture']
      });

      let compteur = 1;
      if (dernierDocument?.numero_facture) {
        const parts = dernierDocument.numero_facture.split('-');
        compteur = parseInt(parts[2], 10) + 1 || 1;
      }

      return `FAC-${annee}-${String(compteur).padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Erreur genererNumeroFacture:', error);
      throw new Error('Erreur lors de la génération du numéro de facture');
    }
  }

  // 🔹 CRÉER DOCUMENT
  static async creerDocument({
    clientId,
    delais_execution,
    date_execution,
    avance,
    lieu_execution,
    moyen_paiement = 'ESPECES',
    items,
    utilisateurConnecte,
    tva
  }) {
    const transaction = await sequelize.transaction();

    try {
      // 1️⃣ Client
      const client = await Utilisateur.findByPk(clientId);
      if (!client) {
        await transaction.rollback();
        return { success: false, error: 'Client non trouvé' };
      }

      // 2️⃣ Items
      if (!Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return { success: false, error: 'Aucun produit fourni' };
      }

      // 3️⃣ Montant
      const montant = items.reduce((total, item) => {
        return total +
          (Number(item.quantite) || 0) *
          (Number(item.prix_unitaire) || 0);
      }, 0);

      if (montant <= 0) {
        await transaction.rollback();
        return { success: false, error: 'Montant invalide' };
      }

      // 4️⃣ Numéro facture
      const numero_facture = await this.genererNumeroFacture();

      // 5️⃣ Document
      const document = await Document.create({
        numero_facture,
        clientId,
        professionnelId: utilisateurConnecte.id,
        delais_execution: delais_execution || null,
        date_execution: date_execution || null,
        avance: Number(avance) || 0,
        lieu_execution: lieu_execution || null,
        montant,
        tva: Number(tva) || 0,
        moyen_paiement,
        document_pdf: null
      }, { transaction });

      // 6️⃣ Items DB
      await DocumentItem.bulkCreate(
        items.map(item => ({
          designation: item.designation,
          quantite: Number(item.quantite) || 0,
          prix_unitaire: Number(item.prix_unitaire) || 0,
          documentId: document.id
        })),
        { transaction }
      );

      await transaction.commit();

      // 7️⃣ PDF
      let html;

      if (utilisateurConnecte.role === 'Professionnel') {

        // ✅ TEMPLATE ENTREPRISE
        html = templateEntreprise({
          numeroFacture: numero_facture,

          nomClient: `${client.nom} ${client.prenom}`,
          cniClient: client.carte_identite_national_num,

          nomUtilisateur: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
          telephone: utilisateurConnecte.telephone,
          email: utilisateurConnecte.email,
          logo: utilisateurConnecte.logo,

          rc: utilisateurConnecte.rc,
          ninea: utilisateurConnecte.ninea,
          signature: utilisateurConnecte.signature,

          nomEntreprise: utilisateurConnecte.nomEntreprise,
          adresseEntreprise: utilisateurConnecte.adresseEntreprise,
          telephoneEntreprise: utilisateurConnecte.telephoneEntreprise,
          emailEntreprise: utilisateurConnecte.emailEntreprise,

          delais_execution: delais_execution || '-',
          date_execution: date_execution
            ? new Date(date_execution).toLocaleDateString('fr-FR')
            : '-',

          avance: Number(avance) || 0,
          lieu_execution: lieu_execution || '-',
          montant,
          moyen_paiement,
          tva: Number(tva) || 0,

          items: items.map(i => ({
            designation: i.designation,
            quantite: Number(i.quantite),
            prix_unitaire: Number(i.prix_unitaire)
          })),

          dateGeneration: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });

      } else {

        // ✅ TEMPLATE INDEPENDANT
        html = templateIndependant({
          numeroFacture: numero_facture,

          nomClient: `${client.nom} ${client.prenom}`,
          cniClient: client.carte_identite_national_num,

          nomUtilisateur: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
          telephone: utilisateurConnecte.telephone,
          email: utilisateurConnecte.email,
          logo: utilisateurConnecte.logo,

          delais_execution: delais_execution || '-',
          date_execution: date_execution
            ? new Date(date_execution).toLocaleDateString('fr-FR')
            : '-',

          avance: Number(avance) || 0,
          lieu_execution: lieu_execution || '-',
          montant,
          moyen_paiement,

          items: items.map(i => ({
            designation: i.designation,
            quantite: Number(i.quantite),
            prix_unitaire: Number(i.prix_unitaire)
          })),

          dateGeneration: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });

      }

      const pdfBuffer = await generatePDFBuffer(html);
      const pdfBase64 = pdfBuffer.toString('base64');

      await Document.update(
        { document_pdf: pdfBase64 },
        { where: { id: document.id } }
      );

      await envoyerDocumentEmail({
        emailClient: client.email,
        emailProfessionnel: utilisateurConnecte.email,
        numero_facture,
        pdfBase64
      });

      return {
        success: true,
        message: 'Document créé avec succès',
        data: {
          documentId: document.id,
          numero_facture
        }
      };

    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      console.error('❌ Erreur creerDocument:', error);
      return { success: false, message: error.message };
    }
  }

  static async getMesDocuments({ utilisateurConnecte }) {
    try {
      const documents = await Document.findAll({
        where: {
          professionnelId: utilisateurConnecte.id
        },
        include: [
          {
            model: Utilisateur,
            as: 'client',
            attributes: ['id', 'nom', 'prenom', 'email']
          },
          {
            model: DocumentItem,
            as: 'items'
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: documents
      };

    } catch (error) {
      console.error('❌ Erreur getMesDocuments:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des documents'
      };
    }
  }

  static async telechargerDocument({ documentId, utilisateurConnecte }) {
    try {
      const document = await Document.findOne({
        where: {
          id: documentId,
          professionnelId: utilisateurConnecte.id
        }
      });

      if (!document) {
        return {
          success: false,
          error: 'Document introuvable ou accès non autorisé'
        };
      }

      if (!document.document_pdf) {
        return {
          success: false,
          error: 'Aucun PDF disponible pour ce document'
        };
      }

      // Conversion Base64 → Buffer
      const pdfBuffer = Buffer.from(document.document_pdf, 'base64');

      return {
        success: true,
        data: {
          pdfBuffer,
          numero_facture: document.numero_facture
        }
      };

    } catch (error) {
      console.error('❌ Erreur telechargerDocument:', error);
      return {
        success: false,
        error: 'Erreur lors du téléchargement du document'
      };
    }
  }

  static async ouvrirDocument(req, res) {
    try {
      const utilisateurConnecte = req.user;
      const { documentId } = req.params;

      const document = await Document.findOne({
        where: {
          id: documentId,
          professionnelId: utilisateurConnecte.id
        }
      });

      if (!document || !document.document_pdf) {
        return res.status(404).json({
          success: false,
          error: 'Document introuvable'
        });
      }

      const pdfBuffer = Buffer.from(document.document_pdf, 'base64');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${document.numero_facture}.pdf"`
      );

      return res.send(pdfBuffer);

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }


}

// 🔧 PDF
async function generatePDFBuffer(html) {
  const pdf = require('html-pdf');

  return new Promise((resolve, reject) => {
    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}


module.exports = GestionDocumentService;
