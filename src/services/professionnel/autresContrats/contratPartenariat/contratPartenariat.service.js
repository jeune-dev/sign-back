const { ContratPartenariat, Utilisateur } = require('../../../../models');
const sequelize = require('../../../../config/db');
const { Op } = require('sequelize');
const contratPartenariatTemplate = require('../../../../templates/pdf/autresContrats/contratPartenariat/contratPartenariat.template');
const envoyerEmailPartenariat = require('./emailFormatContratPartenariat');

class ContratPartenariatService {

  static async genererNumeroContrat() {
    const annee = new Date().getFullYear();
    const dernier = await ContratPartenariat.findOne({
      where: { numero_contrat: { [Op.like]: `PARTN-${annee}-%` } },
      order: [['createdAt', 'DESC']],
      attributes: ['numero_contrat']
    });
    let compteur = 1;
    if (dernier?.numero_contrat) {
      const parts = dernier.numero_contrat.split('-');
      compteur = parseInt(parts[2], 10) + 1 || 1;
    }
    return `PARTN-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  static async creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur }) {
    const transaction = await sequelize.transaction();
    try {
      const generateur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!generateur) { await transaction.rollback(); return { success: false, error: 'Générateur introuvable' }; }

      const autrePartie = await Utilisateur.findByPk(autrePartieId);
      if (!autrePartie) { await transaction.rollback(); return { success: false, error: 'Autre partie introuvable' }; }

      if (!data?.objet_partenariat) { await transaction.rollback(); return { success: false, error: "L'objet du partenariat est requis" }; }

      const numero_contrat = await this.genererNumeroContrat();

      const contrat = await ContratPartenariat.create({
        numero_contrat,
        generateurId: generateur.id,
        autrePartieId: autrePartie.id,
        ...data,
        signature_generateur,
        statut: 'en_attente',
        contrat_pdf: null
      }, { transaction });

      await transaction.commit();

      const pdfBuffer = await contratPartenariatTemplate({ numero_contrat, generateur, autrePartie, contrat });
      const pdfBase64 = pdfBuffer.toString('base64');
      await ContratPartenariat.update({ contrat_pdf: pdfBase64 }, { where: { id: contrat.id } });

      try {
        await envoyerEmailPartenariat({ emailGenerateur: generateur.email, emailAutrePartie: autrePartie.email, numero_contrat, objet: contrat.objet_partenariat, pdfBase64 });
      } catch (err) { console.error('❌ Erreur envoi email partenariat:', err); }

      return { success: true, message: 'Contrat de partenariat créé avec succès', data: contrat };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async signerContrat({ contratId, utilisateurConnecte, signature }) {
    try {
      const contrat = await ContratPartenariat.findOne({ where: { id: contratId, autrePartieId: utilisateurConnecte.id } });
      if (!contrat) return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      await contrat.update({ signature_autre_partie: signature, statut: 'signe', date_signature_dest: new Date() });
      return { success: true, message: 'Contrat signé avec succès' };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getContratById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await ContratPartenariat.findOne({
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
      const contrats = await ContratPartenariat.findAll({
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
      const contrat = await ContratPartenariat.findByPk(contratId);
      if (!contrat || !contrat.contrat_pdf) return { success: false, message: 'PDF introuvable' };
      return { success: true, data: { pdfBuffer: Buffer.from(contrat.contrat_pdf, 'base64'), numero_contrat: contrat.numero_contrat } };
    } catch (error) { return { success: false, message: error.message }; }
  }
}

module.exports = ContratPartenariatService;
