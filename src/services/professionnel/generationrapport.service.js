const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const paginate = require('../../utils/paginate');
const templateDocument = require('../../templates/pdf/document.template');

const templateEntreprise = require('../../templates/pdf/factureEntreprise.template');
const templateIndependant = require('../../templates/pdf/factureIndependant.template');
const { Op } = require('sequelize');
const { uploadPdf, downloadPdf, makePdfKey } = require('../r2.service');
const { sendDocumentEmail } = require('../resend.service');

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
    montant_paye,
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
        return { success: false, message: 'Client non trouvé' };
      }

      // 2️⃣ Items
      if (!Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return { success: false, message: 'Aucun produit fourni' };
      }

      // 3️⃣ Montant
      const montant = items.reduce((total, item) => {
        return total +
          (Number(item.quantite) || 0) *
          (Number(item.prix_unitaire) || 0);
      }, 0);

      if (montant <= 0) {
        await transaction.rollback();
        return { success: false, message: 'Montant invalide' };
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
        montant_paye: Number(montant_paye) || 0,
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
          montant_paye: Number(montant_paye) || 0,
          lieu_execution: lieu_execution || '-',
          montant,
          moyen_paiement,
          tva: Number(tva) || 0,

          items: items.map(i => ({
            designation: i.designation,
            quantite: Number(i.quantite),
            prix_unitaire: Number(i.prix_unitaire)
          })),

          dateGeneration: (() => {
            const d = new Date();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${mm}/${dd}/${yyyy}`;
          })()
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
          signature: utilisateurConnecte.signature,

          delais_execution: delais_execution || '-',
          date_execution: date_execution
            ? new Date(date_execution).toLocaleDateString('fr-FR')
            : '-',

          avance: Number(avance) || 0,
          montant_paye: Number(montant_paye) || 0,
          lieu_execution: lieu_execution || '-',
          montant,
          moyen_paiement,

          items: items.map(i => ({
            designation: i.designation,
            quantite: Number(i.quantite),
            prix_unitaire: Number(i.prix_unitaire)
          })),

          dateGeneration: (() => {
            const d = new Date();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${mm}/${dd}/${yyyy}`;
          })()
        });

      }

      const pdfBuffer = await generatePDFBuffer(html);
      const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('facture', numero_facture));

      await Document.update(
        { document_pdf: pdfKey },
        { where: { id: document.id } }
      );

      // Email best-effort — une failure n'annule pas la facture
      sendDocumentEmail({
        emailClient: client.email,
        emailProfessionnel: utilisateurConnecte.email,
        numero_facture,
        pdfBase64: pdfBuffer.toString('base64'),
        nomClient: `${client.prenom} ${client.nom}`,
        nomProfessionnel: `${utilisateurConnecte.prenom} ${utilisateurConnecte.nom}`,
        nomEntreprise: utilisateurConnecte.nomEntreprise || '',
        type: 'Facture'
      }).catch(err => console.error('[email] Échec envoi facture', numero_facture, '—', err.message));

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

  static async getMesDocuments({ utilisateurConnecte, page, limit }) {
    try {
      const { page: p, limit: l, offset } = paginate(page, limit);

      const { count, rows } = await Document.findAndCountAll({
        where: { professionnelId: utilisateurConnecte.id },
        include: [
          { model: Utilisateur, as: 'client', attributes: ['id', 'nom', 'prenom', 'email'] },
          { model: DocumentItem, as: 'items' }
        ],
        order: [['createdAt', 'DESC']],
        limit: l,
        offset,
        distinct: true
      });

      return {
        success: true,
        data: rows,
        pagination: { total: count, totalPages: Math.ceil(count / l), page: p, limit: l }
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
      const pdfBuffer = await downloadPdf(document.document_pdf);

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

  static async ouvrirDocument({ documentId, utilisateurConnecte }) {
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
          error: 'Document introuvable'
        };
      }

      if (!document.document_pdf) {
        return {
          success: false,
          error: 'PDF manquant'
        };
      }

      const pdfBuffer = await downloadPdf(document.document_pdf);

      return {
        success: true,
        data: {
          pdfBuffer,
          numero_facture: document.numero_facture
        }
      };

    } catch (error) {
      console.error('SERVICE ERROR:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  // ── Renvoi de facture payée (regénère PDF + renvoie email) ──────────────────
  static async renvoyerFacture({ documentId, professionnelId }) {
    try {
      const document = await Document.findOne({
        where: { id: documentId, professionnelId },
        include: [
          { model: Utilisateur, as: 'client' },
          { model: DocumentItem, as: 'items' }
        ]
      });

      if (!document) {
        return { success: false, message: 'Facture introuvable ou accès non autorisé' };
      }

      if (document.statut !== 'payee') {
        return { success: false, message: 'Seules les factures payées peuvent être renvoyées' };
      }

      const professionnel = await Utilisateur.findByPk(professionnelId);
      if (!professionnel) {
        return { success: false, message: 'Professionnel introuvable' };
      }

      const client = document.client;
      const items = document.items;

      let html;
      if (professionnel.role === 'Professionnel') {
        html = templateEntreprise({
          numeroFacture: document.numero_facture,
          nomClient: `${client.nom} ${client.prenom}`,
          cniClient: client.carte_identite_national_num,
          nomUtilisateur: `${professionnel.nom} ${professionnel.prenom}`,
          telephone: professionnel.telephone,
          email: professionnel.email,
          logo: professionnel.logo,
          rc: professionnel.rc,
          ninea: professionnel.ninea,
          signature: professionnel.signature,
          nomEntreprise: professionnel.nomEntreprise,
          adresseEntreprise: professionnel.adresseEntreprise,
          telephoneEntreprise: professionnel.telephoneEntreprise,
          emailEntreprise: professionnel.emailEntreprise,
          delais_execution: document.delais_execution || '-',
          date_execution: document.date_execution
            ? new Date(document.date_execution).toLocaleDateString('fr-FR')
            : '-',
          avance: document.avance,
          montant_paye: document.montant_paye || 0,
          lieu_execution: document.lieu_execution || '-',
          montant: document.montant,
          moyen_paiement: document.moyen_paiement,
          tva: document.tva || 0,
          items: items.map(i => ({
            designation: i.designation,
            quantite: Number(i.quantite),
            prix_unitaire: Number(i.prix_unitaire)
          })),
          dateGeneration: (() => {
            const d = new Date();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${mm}/${dd}/${yyyy}`;
          })()
        });
      } else {
        html = templateIndependant({
          numeroFacture: document.numero_facture,
          nomClient: `${client.nom} ${client.prenom}`,
          cniClient: client.carte_identite_national_num,
          nomUtilisateur: `${professionnel.nom} ${professionnel.prenom}`,
          telephone: professionnel.telephone,
          email: professionnel.email,
          logo: professionnel.logo,
          delais_execution: document.delais_execution || '-',
          date_execution: document.date_execution
            ? new Date(document.date_execution).toLocaleDateString('fr-FR')
            : '-',
          avance: document.avance,
          montant_paye: document.montant_paye || 0,
          lieu_execution: document.lieu_execution || '-',
          montant: document.montant,
          moyen_paiement: document.moyen_paiement,
          items: items.map(i => ({
            designation: i.designation,
            quantite: Number(i.quantite),
            prix_unitaire: Number(i.prix_unitaire)
          })),
          dateGeneration: (() => {
            const d = new Date();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${mm}/${dd}/${yyyy}`;
          })()
        });
      }

      const pdfBuffer = await generatePDFBuffer(html);

      await sendDocumentEmail({
        emailClient: client.email,
        emailProfessionnel: professionnel.email,
        numero_facture: document.numero_facture,
        pdfBase64: pdfBuffer.toString('base64'),
        nomClient: `${client.prenom} ${client.nom}`,
        nomProfessionnel: `${professionnel.prenom} ${professionnel.nom}`,
        nomEntreprise: professionnel.nomEntreprise || '',
        type: 'Facture'
      });

      return { success: true, message: 'Facture renvoyée avec succès' };

    } catch (error) {
      console.error('❌ Erreur renvoyerFacture:', error);
      return { success: false, message: error.message };
    }
  }

  // ── Mise à jour d'une facture (avance + statut) ──────────────────────────────
  static async mettreAJourFacture({ documentId, professionnelId, avance, statut }) {
    try {
      const document = await Document.findOne({
        where: { id: documentId, professionnelId }
      });

      if (!document) {
        return { success: false, message: 'Facture introuvable ou accès non autorisé' };
      }

      const statutsValides = ['en_attente', 'partiel', 'payee'];
      if (statut && !statutsValides.includes(statut)) {
        return { success: false, message: 'Statut invalide' };
      }

      const updates = {};
      if (avance !== undefined && avance !== null) {
        const nouvelleAvance = Number(avance);
        if (isNaN(nouvelleAvance) || nouvelleAvance < 0) {
          return { success: false, message: 'Montant avance invalide' };
        }
        if (nouvelleAvance > document.montant) {
          return { success: false, message: 'L\'avance ne peut pas dépasser le montant total' };
        }
        updates.avance = nouvelleAvance;
      }
      if (statut) updates.statut = statut;

      await Document.update(updates, { where: { id: documentId, professionnelId } });

      const updated = await Document.findByPk(documentId);

      return {
        success: true,
        data: {
          id: updated.id,
          avance: updated.avance,
          montant: updated.montant,
          statut: updated.statut,
          resteAPayer: updated.montant - updated.avance,
        },
      };
    } catch (error) {
      console.error('❌ Erreur mettreAJourFacture:', error);
      return { success: false, message: error.message };
    }
  }

}

// 🔧 PDF
async function generatePDFBuffer(html) {
  const pdf = require('html-pdf');

  return new Promise((resolve, reject) => {
    pdf.create(html, {
      format: 'A4',
      width: '210mm',
      border: {
        top: '20mm',
        right: '18mm',
        bottom: '20mm',
        left: '18mm'
      }
    }).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}


module.exports = GestionDocumentService;
