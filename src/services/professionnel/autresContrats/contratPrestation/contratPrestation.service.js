const { ContratPrestation, Utilisateur } = require('../../../../models');
const sequelize = require('../../../../config/db');
const { Op } = require('sequelize');
const contratPrestationTemplate = require('../../../../templates/pdf/autresContrats/contratPrestation/contratPrestation.template');
const envoyerEmailPrestation = require('./emailFormatContratPrestation');
const { sendPushToUsers } = require('../../../../services/notification.service');
const { uploadPdf, downloadPdf, makePdfKey } = require('../../../../services/r2.service');

class ContratPrestationService {

  // ============================================================
  // GÉNÉRER NUMÉRO DE CONTRAT
  // ============================================================
  static async genererNumeroContrat() {
    const annee = new Date().getFullYear();
    const dernier = await ContratPrestation.findOne({
      where: { numero_contrat: { [Op.like]: `CONTRAT-PRESTATION-${annee}-%` } },
      order: [['createdAt', 'DESC']],
      attributes: ['numero_contrat']
    });
    let compteur = 1;
    if (dernier?.numero_contrat) {
      const parts = dernier.numero_contrat.split('-');
      compteur = parseInt(parts[3], 10) + 1 || 1;
    }
    return `CONTRAT-PRESTATION-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  // ============================================================
  // CRÉER CONTRAT DE PRESTATION
  // ============================================================
  static async creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur }) {
    const transaction = await sequelize.transaction();
    try {
      const generateur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!generateur) {
        await transaction.rollback();
        return { success: false, error: 'Générateur introuvable' };
      }

      const autrePartie = await Utilisateur.findByPk(autrePartieId);
      if (!autrePartie) {
        await transaction.rollback();
        return { success: false, error: 'Autre partie introuvable' };
      }

      if (!data?.titre_contrat) {
        await transaction.rollback();
        return { success: false, error: 'Le titre du contrat est requis' };
      }

      if (!data?.montant_total || Number(data.montant_total) <= 0) {
        await transaction.rollback();
        return { success: false, error: 'Le montant total est invalide' };
      }

      const numero_contrat = await this.genererNumeroContrat();

      const contrat = await ContratPrestation.create({
        numero_contrat,
        generateurId: generateur.id,
        autrePartieId: autrePartie.id,
        ...data,
        signature_generateur,
        statut: 'en_attente',
        contrat_pdf: null
      }, { transaction });

      await transaction.commit();

      const pdfBuffer = await contratPrestationTemplate({ numero_contrat, generateur, autrePartie, contrat });
      const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-prestation', numero_contrat));
      await ContratPrestation.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

      try {
        await envoyerEmailPrestation({
          emailGenerateur: generateur.email,
          emailAutrePartie: autrePartie.email,
          numero_contrat,
          titre: contrat.titre_contrat,
          pdfBase64: pdfBuffer.toString('base64')
        });
      } catch (err) {
        console.error('❌ Erreur envoi email prestation:', err);
      }

      sendPushToUsers(autrePartie.id, {
        title: 'SIGN — Contrat à signer',
        body: `Vous avez un contrat de prestation à signer de la part de ${generateur.prenom} ${generateur.nom}`,
        data: { type: 'contrat-prestation', contratId: String(contrat.id) }
      }).catch(() => {});

      return { success: true, message: 'Contrat de prestation créé avec succès', data: contrat };

    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      console.error('❌ Erreur creerContratPrestation:', error);
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // SIGNATURE AUTRE PARTIE
  // ============================================================
  static async signerContrat({ contratId, utilisateurConnecte, signature }) {
    try {
      const contrat = await ContratPrestation.findOne({
        where: { id: contratId, autrePartieId: utilisateurConnecte.id }
      });

      if (!contrat) return { success: false, message: 'Contrat introuvable ou accès non autorisé' };

      await contrat.update({
        signature_autre_partie: signature,
        statut: 'signe',
        date_signature_dest: new Date()
      });

      return { success: true, message: 'Contrat signé avec succès' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // DÉTAIL CONTRAT
  // ============================================================
  static async getContratById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await ContratPrestation.findOne({
        where: {
          id: contratId,
          [Op.or]: [
            { generateurId: utilisateurConnecte.id },
            { autrePartieId: utilisateurConnecte.id }
          ]
        },
        include: [
          { model: Utilisateur, as: 'generateur', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] },
          { model: Utilisateur, as: 'autrePartie', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] }
        ]
      });

      if (!contrat) return { success: false, error: 'Contrat introuvable ou accès non autorisé' };
      return { success: true, data: contrat };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // MES CONTRATS
  // ============================================================
  static async getMesContrats({ utilisateurConnecte }) {
    try {
      const contrats = await ContratPrestation.findAll({
        where: {
          [Op.or]: [
            { generateurId: utilisateurConnecte.id },
            { autrePartieId: utilisateurConnecte.id }
          ]
        },
        include: [
          { model: Utilisateur, as: 'generateur', attributes: ['id', 'nom', 'prenom', 'email'] },
          { model: Utilisateur, as: 'autrePartie', attributes: ['id', 'nom', 'prenom', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      return { success: true, data: contrats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerContrat({ contratId }) {
    try {
      const contrat = await ContratPrestation.findByPk(contratId);
      if (!contrat || !contrat.contrat_pdf) return { success: false, message: 'PDF introuvable' };
      const pdfBuffer = await downloadPdf(contrat.contrat_pdf);
      return {
        success: true,
        data: { pdfBuffer, numero_contrat: contrat.numero_contrat }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const stats = await ContratPrestation.findAll({
        where: { generateurId: utilisateurConnecte.id },
        attributes: ['statut'],
        raw: true,
      });
      const total = stats.length;
      const signes   = stats.filter(s => s.statut === 'signe').length;
      const enAttente = stats.filter(s => s.statut === 'en_attente').length;
      return { success: true, data: { total, signes, enAttente } };
    } catch (error) {
      return { success: false, error: 'Erreur lors du calcul des statistiques' };
    }
  }
}

module.exports = ContratPrestationService;
