const { QuittanceLoyer, Utilisateur } = require('../../../models');
const paginate = require('../../../utils/paginate');
const sequelize = require('../../../config/db');
const { Op } = require('sequelize');
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../../../services/r2.service');

const quittanceLoyerTemplate = require('../../../templates/pdf/quittanceLoyer/quittanceLoyer.template');
const envoyerQuittanceLoyerEmail = require('./emailFormatQuittanceLoyer');
const { sendPushToUsers } = require('../../../services/notification.service');
const logger = require('../../../utils/logger');

class GestionQuittanceLoyerService {

  // ============================================================
  // 🔹 GÉNÉRER NUMÉRO DE QUITTANCE
  // ============================================================
  static async genererNumeroQuittance() {
    try {
      const annee = new Date().getFullYear();

      const derniereQuittance = await QuittanceLoyer.findOne({
        where: {
          numero_quittance: { [Op.like]: `QUITTANCE-${annee}-%` }
        },
        order: [['createdAt', 'DESC']],
        attributes: ['numero_quittance']
        
      });

      let compteur = 1;

      if (derniereQuittance?.numero_quittance) {
        const parts = derniereQuittance.numero_quittance.split('-');
        compteur = parseInt(parts[2], 10) + 1 || 1;
      }

      return `QUITTANCE-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      logger.error('❌ Erreur genererNumeroQuittance:', error);
      throw new Error('Erreur lors de la génération du numéro de quittance');
    }
  }

  // ============================================================
  // 🔹 CRÉER UNE QUITTANCE DE LOYER
  // ============================================================
  static async creerQuittanceLoyer({
    utilisateurConnecte,
    locataireId,
    data,
    signature_bailleur

  }) {

    const transaction = await sequelize.transaction();

    try {

      // ── 1. Récupérer le bailleur ───────────────────────────
      const bailleur = await Utilisateur.findByPk(utilisateurConnecte.id);

      if (!bailleur) {
        await transaction.rollback();
        return { success: false, message: "Bailleur introuvable" };
      }

      // ── 2. Récupérer le locataire ──────────────────────────
      const locataire = await Utilisateur.findByPk(locataireId);

      if (!locataire) {
        await transaction.rollback();
        return { success: false, message: "Locataire introuvable" };
      }

      // ── 3. VALIDATIONS MÉTIER ──────────────────────────────
      if (!data?.adresse_logement) {
        await transaction.rollback();
        return { success: false, message: "L'adresse du logement est requise" };
      }

      if (!data?.mois) {
        await transaction.rollback();
        return { success: false, message: "Le mois concerné est requis" };
      }

      if (!data?.annee) {
        await transaction.rollback();
        return { success: false, message: "L'année est requise" };
      }

      if (!data?.montant_loyer || Number(data.montant_loyer) <= 0) {
        await transaction.rollback();
        return { success: false, message: "Montant du loyer invalide" };
      }

      if (data.montant_total && Number(data.montant_total) < 0) {
        await transaction.rollback();
        return { success: false, message: "Montant total invalide" };
      }

      // ── 4. NUMÉRO QUITTANCE ────────────────────────────────
      const numero_quittance = await this.genererNumeroQuittance();

      // ── 5. CRÉATION QUITTANCE ──────────────────────────────
      const quittance = await QuittanceLoyer.create({

        numero_quittance,

        bailleurId: bailleur.id,
        locataireId: locataire.id,

        // Informations logement
        adresse_logement: data.adresse_logement,
        type_bien: data.type_bien,

        // Informations paiement
        mois: data.mois,
        annee: data.annee,
        montant_loyer: data.montant_loyer,
        montant_charges: data.montant_charges || 0,
        montant_total: data.montant_total,
        date_paiement: data.date_paiement,
        mode_paiement: data.mode_paiement,
        paiement_complet: data.paiement_complet,
        montant_paye: data.montant_paye || data.montant_total,
        observations: data.observations || null,

        // Informations émission
        ville_emission: data.ville_emission,
        date_emission: data.date_emission || new Date(),

        // Signature automatique bailleur (profil utilisateur)
        signature_bailleur: bailleur.signature || null,

        quittance_pdf: null

      }, { transaction });

      await transaction.commit();

      // ── 6. GÉNÉRATION PDF ─────────────────────────────────
      const pdfBuffer = await quittanceLoyerTemplate({
        numero_quittance: quittance.numero_quittance,
        quittance,

        bailleur,
        locataire,

        logement: {
          adresse: quittance.adresse_logement,
          type_bien: quittance.type_bien
        },

        paiement: {
          mois: quittance.mois,
          annee: quittance.annee,
          montant_loyer: quittance.montant_loyer,
          montant_charges: quittance.montant_charges,
          montant_total: quittance.montant_total,
          date_paiement: quittance.date_paiement,
          mode_paiement: quittance.mode_paiement,
          est_total: quittance.est_total,
          montant_paye_partiel: quittance.montant_paye_partiel,
          observations: quittance.observations
        },

        signature_bailleur
      });

      const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('quittance-loyer', numero_quittance));
      await QuittanceLoyer.update(
        { quittance_pdf: pdfKey },
        { where: { id: quittance.id } }
      );

      // ── 7. ENVOI EMAIL ─────────────────────────────────────
      try {
        await envoyerQuittanceLoyerEmail({
          emailLocataire: locataire.email,
          emailBailleur: bailleur.email,
          numero_quittance,
          mois: quittance.mois,
          annee: quittance.annee,
          montant_total: quittance.montant_total,
          pdfBase64: pdfBuffer.toString('base64'),
          nomSignature: bailleur.nomEntreprise || `${bailleur.prenom} ${bailleur.nom}`
        });

        logger.info("✅ Email quittance envoyé");
      } catch (err) {
        logger.error("❌ Erreur email quittance:", err);
      }

      sendPushToUsers(locataire.id, {
        title: '🧾 Quittance de loyer reçue',
        body: `Votre quittance de loyer pour ${data.mois} ${data.annee} est disponible.`,
        data: { type: 'quittance-loyer', quittanceId: String(quittance.id) },
      });

      return {
        success: true,
        message: "Quittance de loyer générée avec succès",
        data: quittance
      };

    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      logger.error("❌ Erreur creerQuittanceLoyer:", error);
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER QUITTANCE PDF
  // ============================================================
  static async telechargerQuittance({ quittanceId }) {
    try {

      const quittance = await QuittanceLoyer.findByPk(quittanceId);

      if (!quittance || !quittance.quittance_pdf) {
        return { success: false, message: "PDF introuvable" };
      }

      const pdfBuffer = await downloadPdf(quittance.quittance_pdf);
      return {
        success: true,
        data: { pdfBuffer, numero_quittance: quittance.numero_quittance }
      };

    } catch (error) {
      logger.error(error);
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 MES QUITTANCES (BAILLEUR)
  // ============================================================
  static async getMesQuittances({ utilisateurConnecte, page, limit }) {
    try {
      const { page: p, limit: l, offset } = paginate(page, limit);
      const moi = utilisateurConnecte.id;

      // Quittances où je suis bailleur (envoyées) OU locataire (reçues)
      const { count, rows } = await QuittanceLoyer.findAndCountAll({
        where: { [Op.or]: [{ bailleurId: moi }, { locataireId: moi }] },
        include: [
          { model: Utilisateur, as: 'bailleur',  attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] },
          { model: Utilisateur, as: 'locataire', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: l,
        offset,
        distinct: true
      });

      // direction = 'envoye' si je suis le bailleur, sinon 'recu'
      const data = rows.map((r) => ({
        ...r.toJSON(),
        direction: r.bailleurId === moi ? 'envoye' : 'recu',
      }));

      return {
        success: true,
        data,
        pagination: { total: count, totalPages: Math.ceil(count / l), page: p, limit: l }
      };

    } catch (error) {
      logger.error('❌ Erreur getMesQuittances:', error);
      return { success: false, message: 'Erreur serveur' };
    }
  }

  // ============================================================
  // 🔹 DÉTAIL QUITTANCE
  // ============================================================
  static async getQuittanceById({ quittanceId, utilisateurConnecte }) {
    try {

      const quittance = await QuittanceLoyer.findOne({
        where: {
          id: quittanceId,
          bailleurId: utilisateurConnecte.id
        },
        include: [
          {
            model: Utilisateur,
            as: "locataire",
            attributes: ["id", "nom", "prenom", "email", "telephone"]
          }
        ]
      });

      if (!quittance) {
        return { success: false, message: "Quittance introuvable ou accès refusé" };
      }

      return { success: true, data: quittance };

    } catch (error) {
      logger.error(error);
      return { success: false, message: "Erreur lors de la récupération" };
    }
  }
}

module.exports = GestionQuittanceLoyerService;