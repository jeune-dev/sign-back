const { Procuration, Utilisateur } = require('../../../../models');
const sequelize = require('../../../../config/db');
const { Op } = require('sequelize');
const procurationTemplate = require('../../../../templates/pdf/autresContrats/procuration/procuration.template');
const envoyerEmailProcuration = require('./emailFormatProcuration');

class ProcurationService {

  static async genererNumeroContrat() {
    const annee = new Date().getFullYear();
    const dernier = await Procuration.findOne({
      where: { numero_contrat: { [Op.like]: `PROCU-${annee}-%` } },
      order: [['createdAt', 'DESC']],
      attributes: ['numero_contrat']
    });
    let compteur = 1;
    if (dernier?.numero_contrat) {
      const parts = dernier.numero_contrat.split('-');
      compteur = parseInt(parts[2], 10) + 1 || 1;
    }
    return `PROCU-${annee}-${String(compteur).padStart(4, '0')}`;
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

      const contrat = await Procuration.create({
        numero_contrat,
        generateurId: generateur.id,
        autrePartieId: autrePartie.id,
        ...data,
        signature_generateur,
        statut: 'en_attente',
        contrat_pdf: null
      }, { transaction });

      await transaction.commit();

      const pdfBuffer = await procurationTemplate({ numero_contrat, generateur, autrePartie, contrat });
      const pdfBase64 = pdfBuffer.toString('base64');
      await Procuration.update({ contrat_pdf: pdfBase64 }, { where: { id: contrat.id } });

      try {
        await envoyerEmailProcuration({ emailMandant: generateur.email, emailMandataire: autrePartie.email, numero_contrat, objet: contrat.objet_procuration, pdfBase64 });
      } catch (err) { console.error('❌ Erreur envoi email procuration:', err); }

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
      await contrat.update({ signature_autre_partie: signature, statut: 'signe', date_signature_dest: new Date() });
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
      return { success: true, data: { pdfBuffer: Buffer.from(contrat.contrat_pdf, 'base64'), numero_contrat: contrat.numero_contrat } };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const stats = await Procuration.findAll({
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

module.exports = ProcurationService;
