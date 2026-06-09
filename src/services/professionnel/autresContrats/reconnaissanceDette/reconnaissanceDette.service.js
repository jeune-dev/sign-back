const { ReconnaissanceDette, Utilisateur } = require('../../../../models');
const sequelize = require('../../../../config/db');
const { Op } = require('sequelize');
const reconnaissanceDetteTemplate = require('../../../../templates/pdf/autresContrats/reconnaissanceDette/reconnaissanceDette.template');
const envoyerEmailDette = require('./emailFormatReconnaissanceDette');

class ReconnaissanceDetteService {

  static async genererNumeroContrat() {
    const annee = new Date().getFullYear();
    const dernier = await ReconnaissanceDette.findOne({
      where: { numero_contrat: { [Op.like]: `CONTRAT-DETTE-${annee}-%` } },
      order: [['createdAt', 'DESC']],
      attributes: ['numero_contrat']
    });
    let compteur = 1;
    if (dernier?.numero_contrat) {
      const parts = dernier.numero_contrat.split('-');
      compteur = parseInt(parts[3], 10) + 1 || 1;
    }
    return `CONTRAT-DETTE-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  static async creerContrat({ utilisateurConnecte, autrePartieId, data, signature_generateur }) {
    const transaction = await sequelize.transaction();
    try {
      const generateur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!generateur) { await transaction.rollback(); return { success: false, error: 'Générateur introuvable' }; }

      const autrePartie = await Utilisateur.findByPk(autrePartieId);
      if (!autrePartie) { await transaction.rollback(); return { success: false, error: 'Créancier introuvable' }; }

      if (!data?.montant || Number(data.montant) <= 0) { await transaction.rollback(); return { success: false, error: 'Le montant de la dette est invalide' }; }
      if (!data?.motif_dette) { await transaction.rollback(); return { success: false, error: 'Le motif de la dette est requis' }; }

      const numero_contrat = await this.genererNumeroContrat();

      const contrat = await ReconnaissanceDette.create({
        numero_contrat,
        generateurId: generateur.id,
        autrePartieId: autrePartie.id,
        ...data,
        signature_generateur,
        statut: 'en_attente',
        contrat_pdf: null
      }, { transaction });

      await transaction.commit();

      const pdfBuffer = await reconnaissanceDetteTemplate({ numero_contrat, generateur, autrePartie, contrat });
      const pdfBase64 = pdfBuffer.toString('base64');
      await ReconnaissanceDette.update({ contrat_pdf: pdfBase64 }, { where: { id: contrat.id } });

      try {
        await envoyerEmailDette({ emailGenerateur: generateur.email, emailAutrePartie: autrePartie.email, numero_contrat, montant: contrat.montant, devise: contrat.devise, pdfBase64 });
      } catch (err) { console.error('❌ Erreur envoi email dette:', err); }

      return { success: true, message: 'Reconnaissance de dette créée avec succès', data: contrat };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async signerContrat({ contratId, utilisateurConnecte, signature }) {
    try {
      const contrat = await ReconnaissanceDette.findOne({ where: { id: contratId, autrePartieId: utilisateurConnecte.id } });
      if (!contrat) return { success: false, message: 'Document introuvable ou accès non autorisé' };
      await contrat.update({ signature_autre_partie: signature, statut: 'signe', date_signature_dest: new Date() });
      return { success: true, message: 'Document signé avec succès' };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getContratById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await ReconnaissanceDette.findOne({
        where: { id: contratId, [Op.or]: [{ generateurId: utilisateurConnecte.id }, { autrePartieId: utilisateurConnecte.id }] },
        include: [
          { model: Utilisateur, as: 'generateur', attributes: ['id', 'nom', 'prenom', 'email'] },
          { model: Utilisateur, as: 'autrePartie', attributes: ['id', 'nom', 'prenom', 'email'] }
        ]
      });
      if (!contrat) return { success: false, error: 'Document introuvable ou accès non autorisé' };
      return { success: true, data: contrat };
    } catch (error) { return { success: false, error: error.message }; }
  }

  static async getMesContrats({ utilisateurConnecte }) {
    try {
      const contrats = await ReconnaissanceDette.findAll({
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
      const contrat = await ReconnaissanceDette.findByPk(contratId);
      if (!contrat || !contrat.contrat_pdf) return { success: false, message: 'PDF introuvable' };
      return { success: true, data: { pdfBuffer: Buffer.from(contrat.contrat_pdf, 'base64'), numero_contrat: contrat.numero_contrat } };
    } catch (error) { return { success: false, message: error.message }; }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const stats = await ReconnaissanceDette.findAll({
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

module.exports = ReconnaissanceDetteService;
