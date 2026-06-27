const { Procuration, Utilisateur } = require('../../../../models');
const sequelize = require('../../../../config/db');
const { Op } = require('sequelize');
const procurationTemplate = require('../../../../templates/pdf/autresContrats/procuration/procuration.template');
const { sendPushToUsers } = require('../../../../services/notification.service');
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../../../../services/r2.service');
const envoyerEmailProcuration = require('./emailFormatProcuration');

class ProcurationService {

  static async genererNumeroContrat() {
    const annee = new Date().getFullYear();
    const dernier = await Procuration.findOne({
      where: { numero_contrat: { [Op.like]: `CONTRAT-PROCURATION-${annee}-%` } },
      order: [['createdAt', 'DESC']],
      attributes: ['numero_contrat']
    });
    let compteur = 1;
    if (dernier?.numero_contrat) {
      const parts = dernier.numero_contrat.split('-');
      compteur = parseInt(parts[3], 10) + 1 || 1;
    }
    return `CONTRAT-PROCURATION-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  static async creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur }) {
    const transaction = await sequelize.transaction();
    try {
      const generateur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!generateur) { await transaction.rollback(); return { success: false, error: 'Mandant introuvable' }; }

      const autrePartie = await Utilisateur.findByPk(autrePartieId);
      if (!autrePartie) { await transaction.rollback(); return { success: false, error: 'Mandataire introuvable' }; }

      if (!data?.objet_procuration) { await transaction.rollback(); return { success: false, error: "L'objet de la procuration est requis" }; }
      if (!data?.type_procuration) { await transaction.rollback(); return { success: false, error: 'Le type de procuration est requis' }; }

      const numero_contrat = await this.genererNumeroContrat();

      const sigGenUrl = await uploadSignature(signature_generateur);

      const contrat = await Procuration.create({
        numero_contrat,
        generateurId: generateur.id,
        autrePartieId: autrePartie.id,
        ...data,
        signature_generateur: sigGenUrl,
        statut: 'en_attente',
        contrat_pdf: null
      }, { transaction });

      await transaction.commit();

      const pdfBuffer = await procurationTemplate({ numero_contrat, generateur, autrePartie, contrat });
      const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('procuration', numero_contrat));
      await Procuration.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

      try {
        await envoyerEmailProcuration({ emailMandant: generateur.email, emailMandataire: autrePartie.email, numero_contrat, objet: contrat.objet_procuration, pdfBase64: pdfBuffer.toString('base64'), nomSignature: generateur.nomEntreprise || `${generateur.prenom} ${generateur.nom}` });
      } catch (err) { console.error('❌ Erreur envoi email procuration:', err); }

      sendPushToUsers(autrePartie.id, {
        title: 'SIGN — Contrat à signer',
        body: `Vous avez une procuration à signer de la part de ${generateur.prenom} ${generateur.nom}`,
        data: { type: 'procuration', contratId: String(contrat.id) }
      }).catch(() => {});

            return { success: true, message: 'Procuration créée avec succès', data: contrat };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async signerContrat({ contratId, utilisateurConnecte, signature }) {
    try {
      const contrat = await Procuration.findOne({ where: { id: contratId, autrePartieId: utilisateurConnecte.id } });
      if (!contrat) return { success: false, message: 'Procuration introuvable ou accès non autorisé' };
      const sigAutreUrl = await uploadSignature(signature);
      await contrat.update({ signature_autre_partie: sigAutreUrl, statut: 'signe', date_signature_dest: new Date() });

      // Régénère le PDF pour intégrer les signatures des DEUX parties
      try {
        const generateur = await Utilisateur.findByPk(contrat.generateurId);
        const autrePartie = await Utilisateur.findByPk(contrat.autrePartieId);
        const pdfBuffer = await procurationTemplate({ numero_contrat: contrat.numero_contrat, generateur, autrePartie, contrat });
        await contrat.update({ contrat_pdf: pdfBuffer.toString('base64') });
      } catch (e) { console.error('Régénération PDF procuration échouée:', e); }

      return { success: true, message: 'Procuration signée avec succès' };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getContratById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await Procuration.findOne({
        where: { id: contratId, [Op.or]: [{ generateurId: utilisateurConnecte.id }, { autrePartieId: utilisateurConnecte.id }] },
        include: [
          { model: Utilisateur, as: 'generateur', attributes: ['id', 'nom', 'prenom', 'email'] },
          { model: Utilisateur, as: 'autrePartie', attributes: ['id', 'nom', 'prenom', 'email'] }
        ]
      });
      if (!contrat) return { success: false, error: 'Procuration introuvable ou accès non autorisé' };
      return { success: true, data: contrat };
    } catch (error) { return { success: false, error: error.message }; }
  }

  static async getMesContrats({ utilisateurConnecte }) {
    try {
      const contrats = await Procuration.findAll({
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
      const contrat = await Procuration.findByPk(contratId);
      if (!contrat || !contrat.contrat_pdf) return { success: false, message: 'PDF introuvable' };
      const pdfBuffer = await downloadPdf(contrat.contrat_pdf);
      return { success: true, data: { pdfBuffer, numero_contrat: contrat.numero_contrat } };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const stats = await Procuration.findAll({
        where: { [Op.or]: [{ generateurId: utilisateurConnecte.id }, { autrePartieId: utilisateurConnecte.id }] },
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

module.exports = ProcurationService;
