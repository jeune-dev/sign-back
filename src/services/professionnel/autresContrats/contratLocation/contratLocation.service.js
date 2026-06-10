const { ContratLocation, Utilisateur } = require('../../../../models');
const sequelize = require('../../../../config/db');
const { Op } = require('sequelize');
const contratLocationTemplate = require('../../../../templates/pdf/autresContrats/contratLocation/contratLocation.template');
const { sendPushToUsers } = require('../../../../services/notification.service');
const { uploadPdf, downloadPdf, makePdfKey } = require('../../../../services/r2.service');
const envoyerEmailLocation = require('./emailFormatContratLocation');

class ContratLocationService {

  static async genererNumeroContrat() {
    const annee = new Date().getFullYear();
    const dernier = await ContratLocation.findOne({
      where: { numero_contrat: { [Op.like]: `CONTRAT-LOCATION-${annee}-%` } },
      order: [['createdAt', 'DESC']],
      attributes: ['numero_contrat']
    });
    let compteur = 1;
    if (dernier?.numero_contrat) {
      const parts = dernier.numero_contrat.split('-');
      compteur = parseInt(parts[3], 10) + 1 || 1;
    }
    return `CONTRAT-LOCATION-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  static async creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur }) {
    const transaction = await sequelize.transaction();
    try {
      const generateur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!generateur) { await transaction.rollback(); return { success: false, error: 'Générateur introuvable' }; }

      const autrePartie = await Utilisateur.findByPk(autrePartieId);
      if (!autrePartie) { await transaction.rollback(); return { success: false, error: 'Locataire introuvable' }; }

      if (!data?.type_bien) { await transaction.rollback(); return { success: false, error: 'Le type de bien est requis' }; }
      if (!data?.montant_location || Number(data.montant_location) <= 0) { await transaction.rollback(); return { success: false, error: 'Le montant de location est invalide' }; }

      const numero_contrat = await this.genererNumeroContrat();

      const contrat = await ContratLocation.create({
        numero_contrat,
        generateurId: generateur.id,
        autrePartieId: autrePartie.id,
        ...data,
        signature_generateur,
        statut: 'en_attente',
        contrat_pdf: null
      }, { transaction });

      await transaction.commit();

      const pdfBuffer = await contratLocationTemplate({ numero_contrat, generateur, autrePartie, contrat });
      const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-location', numero_contrat));
      await ContratLocation.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

      try {
        await envoyerEmailLocation({ emailGenerateur: generateur.email, emailAutrePartie: autrePartie.email, numero_contrat, type_bien: contrat.type_bien, pdfBase64: pdfBuffer.toString('base64') });
      } catch (err) { console.error('❌ Erreur envoi email location:', err); }

      sendPushToUsers(autrePartie.id, {
        title: 'SIGN — Contrat à signer',
        body: `Vous avez un contrat de location à signer de la part de ${generateur.prenom} ${generateur.nom}`,
        data: { type: 'contrat-location', contratId: String(contrat.id) }
      }).catch(() => {});

            return { success: true, message: 'Contrat de location créé avec succès', data: contrat };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async signerContrat({ contratId, utilisateurConnecte, signature }) {
    try {
      const contrat = await ContratLocation.findOne({ where: { id: contratId, autrePartieId: utilisateurConnecte.id } });
      if (!contrat) return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      await contrat.update({ signature_autre_partie: signature, statut: 'signe', date_signature_dest: new Date() });
      return { success: true, message: 'Contrat signé avec succès' };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getContratById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await ContratLocation.findOne({
        where: { id: contratId, [Op.or]: [{ generateurId: utilisateurConnecte.id }, { autrePartieId: utilisateurConnecte.id }] },
        include: [
          { model: Utilisateur, as: 'generateur', attributes: ['id', 'nom', 'prenom', 'email'] },
          { model: Utilisateur, as: 'autrePartie', attributes: ['id', 'nom', 'prenom', 'email'] }
        ]
      });
      if (!contrat) return { success: false, error: 'Contrat introuvable ou accès non autorisé' };
      return { success: true, data: contrat };
    } catch (error) { return { success: false, error: error.message }; }
  }

  static async getMesContrats({ utilisateurConnecte }) {
    try {
      const contrats = await ContratLocation.findAll({
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
      const contrat = await ContratLocation.findByPk(contratId);
      if (!contrat || !contrat.contrat_pdf) return { success: false, message: 'PDF introuvable' };
      const pdfBuffer = await downloadPdf(contrat.contrat_pdf);
      return { success: true, data: { pdfBuffer, numero_contrat: contrat.numero_contrat } };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const stats = await ContratLocation.findAll({
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

module.exports = ContratLocationService;
