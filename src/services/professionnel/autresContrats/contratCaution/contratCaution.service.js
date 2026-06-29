const { ContratCaution, Utilisateur } = require('../../../../models');
const sequelize = require('../../../../config/db');
const { Op } = require('sequelize');
const contratCautionTemplate = require('../../../../templates/pdf/autresContrats/contratCaution/contratCaution.template');
const { sendPushToUsers } = require('../../../../services/notification.service');
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../../../../services/r2.service');
const envoyerEmailCaution = require('./emailFormatContratCaution');
const envoyerEmailContratSigne = require('../emailFormatContratSigne');
const logger = require('../../../../utils/logger');

class ContratCautionService {

  static async genererNumeroContrat() {
    const annee = new Date().getFullYear();
    const dernier = await ContratCaution.findOne({
      where: { numero_contrat: { [Op.like]: `CONTRAT-CAUTION-${annee}-%` } },
      order: [['createdAt', 'DESC']],
      attributes: ['numero_contrat']
    });
    let compteur = 1;
    if (dernier?.numero_contrat) {
      const parts = dernier.numero_contrat.split('-');
      compteur = parseInt(parts[3], 10) + 1 || 1;
    }
    return `CONTRAT-CAUTION-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  static async creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur }) {
    const transaction = await sequelize.transaction();
    try {
      const generateur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!generateur) { await transaction.rollback(); return { success: false, message: 'Générateur introuvable' }; }

      const autrePartie = await Utilisateur.findByPk(autrePartieId);
      if (!autrePartie) { await transaction.rollback(); return { success: false, message: 'Autre partie introuvable' }; }

      if (!data?.montant_garanti || Number(data.montant_garanti) <= 0) { await transaction.rollback(); return { success: false, message: 'Le montant garanti est invalide' }; }
      if (!data?.type_caution) { await transaction.rollback(); return { success: false, message: 'Le type de caution est requis' }; }

      const numero_contrat = await this.genererNumeroContrat();

      const sigGenUrl = await uploadSignature(signature_generateur);

      const contrat = await ContratCaution.create({
        numero_contrat,
        generateurId: generateur.id,
        autrePartieId: autrePartie.id,
        ...data,
        signature_generateur: sigGenUrl,
        statut: 'en_attente',
        contrat_pdf: null
      }, { transaction });

      await transaction.commit();

      const pdfBuffer = await contratCautionTemplate({ numero_contrat, generateur, autrePartie, contrat });
      const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-caution', numero_contrat));
      await ContratCaution.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

      try {
        await envoyerEmailCaution({ emailGenerateur: generateur.email, emailAutrePartie: autrePartie.email, numero_contrat, montant: contrat.montant_garanti, pdfBase64: pdfBuffer.toString('base64'), nomSignature: generateur.nomEntreprise || `${generateur.prenom} ${generateur.nom}` });
      } catch (err) { logger.error('❌ Erreur envoi email caution:', err); }

      sendPushToUsers(autrePartie.id, {
        title: 'SIGN — Contrat à signer',
        body: `Vous avez un contrat de caution à signer de la part de ${generateur.prenom} ${generateur.nom}`,
        data: { type: 'contrat-caution', contratId: String(contrat.id) }
      }).catch(() => {});

            return { success: true, message: 'Contrat de caution créé avec succès', data: contrat };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async signerContrat({ contratId, utilisateurConnecte, signature }) {
    try {
      const contrat = await ContratCaution.findOne({ where: { id: contratId, autrePartieId: utilisateurConnecte.id } });
      if (!contrat) return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      if (contrat.statut === 'signe') return { success: false, message: 'Ce contrat est déjà signé' };

      const sigAutreUrl = await uploadSignature(signature);
      await contrat.update({ signature_autre_partie: sigAutreUrl, statut: 'signe', date_signature_dest: new Date() });
      await contrat.reload();

      try {
        const generateur = await Utilisateur.findByPk(contrat.generateurId);
        const autrePartie = await Utilisateur.findByPk(contrat.autrePartieId);
        const pdfBuffer = await contratCautionTemplate({ numero_contrat: contrat.numero_contrat, generateur, autrePartie, contrat });

        const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-caution', contrat.numero_contrat));
        await ContratCaution.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

        await envoyerEmailContratSigne({
          emailGenerateur: generateur.email,
          emailAutrePartie: autrePartie.email,
          numero_contrat: contrat.numero_contrat,
          typeDocument: 'Contrat de caution',
          details: [{ label: 'Numéro', value: contrat.numero_contrat }, { label: 'Montant garanti', value: `${Number(contrat.montant_garanti).toLocaleString('fr-FR')} FCFA` }],
          pdfBase64: pdfBuffer.toString('base64'),
          nomSignature: generateur.nomEntreprise || `${generateur.prenom} ${generateur.nom}`,
        });

        sendPushToUsers(generateur.id, {
          title: 'SIGN — Contrat signé ✅',
          body: `Votre contrat de caution ${contrat.numero_contrat} a été signé`,
          data: { type: 'contrat-caution', contratId: String(contrat.id) }
        }).catch(() => {});
      } catch (e) { logger.error('Post-signature caution:', e); }

      return { success: true, message: 'Contrat signé avec succès' };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getContratById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await ContratCaution.findOne({
        where: { id: contratId, [Op.or]: [{ generateurId: utilisateurConnecte.id }, { autrePartieId: utilisateurConnecte.id }] },
        include: [
          { model: Utilisateur, as: 'generateur', attributes: ['id', 'nom', 'prenom', 'email'] },
          { model: Utilisateur, as: 'autrePartie', attributes: ['id', 'nom', 'prenom', 'email'] }
        ]
      });
      if (!contrat) return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      return { success: true, data: contrat };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getMesContrats({ utilisateurConnecte }) {
    try {
      const contrats = await ContratCaution.findAll({
        where: { [Op.or]: [{ generateurId: utilisateurConnecte.id }, { autrePartieId: utilisateurConnecte.id }] },
        include: [
          { model: Utilisateur, as: 'generateur', attributes: ['id', 'nom', 'prenom', 'email'] },
          { model: Utilisateur, as: 'autrePartie', attributes: ['id', 'nom', 'prenom', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      return { success: true, data: contrats };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async telechargerContrat({ contratId }) {
    try {
      const contrat = await ContratCaution.findByPk(contratId);
      if (!contrat || !contrat.contrat_pdf) return { success: false, message: 'PDF introuvable' };
      const pdfBuffer = await downloadPdf(contrat.contrat_pdf);
      return { success: true, data: { pdfBuffer, numero_contrat: contrat.numero_contrat } };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const stats = await ContratCaution.findAll({
        where: { [Op.or]: [{ generateurId: utilisateurConnecte.id }, { autrePartieId: utilisateurConnecte.id }] },
        attributes: ['statut'],
        raw: true,
      });
      const total = stats.length;
      const signes   = stats.filter(s => s.statut === 'signe').length;
      const enAttente = stats.filter(s => s.statut === 'en_attente').length;
      return { success: true, data: { total, signes, enAttente } };
    } catch (error) {
      return { success: false, message: 'Erreur lors du calcul des statistiques' };
    }
  }
}

module.exports = ContratCautionService;
