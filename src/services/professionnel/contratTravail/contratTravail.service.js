const { ContratTravail, Utilisateur } = require('../../../models');
const paginate = require('../../../utils/paginate');
const sequelize         = require('../../../config/db');
const { Op }            = require('sequelize');
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../../../services/r2.service');

const contratTravailTemplate = require('../../../templates/pdf/contratTravail/contratTravail.template');
const envoyerContratTravailEmail = require('./emailFormatContratTravail');
const envoyerEmailContratSigne = require('../autresContrats/emailFormatContratSigne');
const { sendPushToUsers } = require('../../../services/notification.service');
const logger = require('../../../utils/logger');

class GestionContratTravailService {

  // ============================================================
  // 🔹 GÉNÉRER NUMÉRO DE CONTRAT
  // ============================================================
  static async genererNumeroContrat() {
    try {
      const annee = new Date().getFullYear();

      const dernierContrat = await ContratTravail.findOne({
        where:      { numero_contrat: { [Op.like]: `CONTRAT-TRAVAIL-${annee}-%` } },
        order:      [['createdAt', 'DESC']],
        attributes: ['numero_contrat']
      });

      let compteur = 1;
      if (dernierContrat?.numero_contrat) {
        const parts = dernierContrat.numero_contrat.split('-');
        compteur    = parseInt(parts[3], 10) + 1 || 1;
      }

      return `CONTRAT-TRAVAIL-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      logger.error('❌ Erreur genererNumeroContrat:', error);
      throw new Error('Erreur lors de la génération du numéro de contrat');
    }
  }

// ============================================================
// 🔹 CRÉER UN CONTRAT DE BAIL
// ============================================================
static async creerContratTravail({
  utilisateurConnecte,
  salarieId,
  data,
  signature_employeur

}) {
  const transaction = await sequelize.transaction();

  try {

    // ── 1. Récupérer le employeur complet ────────────────────
    const employeur = await Utilisateur.findByPk(utilisateurConnecte.id);
    if (!employeur) {
      await transaction.rollback();
      return { success: false, message: 'Cette employer est introuvable' };
    }

    // ── 2. Récupérer le salarié ─────────────────────────
    const salarie = await Utilisateur.findByPk(salarieId);
    if (!salarie) {
      await transaction.rollback();
      return { success: false, message: 'Salarié introuvable' };
    }

    // ── 3. Validations métier ───────────────────────────────
    if (!data?.poste) {
      await transaction.rollback();
      return { success: false, message: 'Le poste est requis' };
    }

    if (!data?.salaire_mensuel || Number(data.salaire_mensuel) <= 0) {
      await transaction.rollback();
      return { success: false, message: 'Le montant du salaire est invalide' };
    }

    if (data.type_contrat && !['CDI', 'CDD', 'Stage', 'Freelance'].includes(data.type_contrat)) {
      await transaction.rollback();
      return { success: false, message: 'Le type de contrat est invalide' };
    }

    // Validation jour_travail : doit être un tableau non vide
    if (!Array.isArray(data.jour_travail) || data.jour_travail.length === 0) {
      await transaction.rollback();
      return { success: false, message: 'Veuillez ajouter au moins un jour de travail' };
    }

    // Valider que chaque jour a debut et fin au format HH:MM:SS
    for (const j of data.jour_travail) {
      if (!j.jour || !j.debut || !j.fin) {
        await transaction.rollback();
        return { success: false, message: `Jour "${j.jour || '?'}" : heure début et fin obligatoires` };
      }
    }
    // Supprimer heure_debut/fin s'ils ont été envoyés (plus utilisés)
    delete data.heure_debut;
    delete data.heure_fin;

    // ── 4. Numéro de contrat ────────────────────────────────
    const numero_contrat = await this.genererNumeroContrat();

    const sigEmployeurUrl = await uploadSignature(signature_employeur);

    // ── 5. Création du contrat ──────────────────────────────
    const contrat = await ContratTravail.create({
      numero_contrat,
      employeurId: employeur.id,
      salarieId: salarie.id,

      ...data,
      signature_employeur: sigEmployeurUrl,
      statut: 'en_attente',
      contrat_pdf: null,

    }, { transaction });

    // ── Commit de la transaction ────────────────────────────
    await transaction.commit();

    // ── 7. Génération du PDF ────────────────────────────────
    const pdfBuffer = await contratTravailTemplate({
      numero_contrat,
      employeur: {
        nom:           employeur.nom,
        prenom:        employeur.prenom,
        email:         employeur.email,
        telephone:     employeur.telephone,
        adresse:       employeur.adresse,
        nomEntreprise: employeur.nomEntreprise || null,
        // Signature tracée à la création du contrat (repli sur celle du profil)
        signature:     contrat.signature_employeur || employeur.signature || null,
      },
      salarie: {
        nom:       salarie.nom,
        prenom:    salarie.prenom,
        email:     salarie.email,
        telephone: salarie.telephone,
        // Signature du salarié (renseignée seulement après sa signature)
        signature: contrat.signature_salarie || null,
      },
      contrat
    });

    // ── 8. Stocker le PDF sur R2 ────────────────────────────
    const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-travail', numero_contrat));
    await ContratTravail.update(
      { contrat_pdf: pdfKey },
      { where: { id: contrat.id } }
    );

    // ── 9. Envoi des emails ─────────────────────────────────
    try {
      await envoyerContratTravailEmail({
        emailSalarie: salarie.email,
        emailEmployeur: employeur.email,
        numero_contrat,
        poste: contrat.poste,
        date_debut: contrat.date_debut,
        pdfBase64: pdfBuffer.toString('base64'),
        nomSignature: employeur.nomEntreprise || `${employeur.prenom} ${employeur.nom}`
      });
      logger.info('✅ Emails envoyés avec succès');
    } catch (err) {
      logger.error('❌ Erreur lors de l\'envoi des emails :', err);
    }

    sendPushToUsers(salarie.id, {
      title: 'SIGN — Contrat à signer',
      body: `Vous avez un contrat de travail à signer de la part de ${employeur.prenom} ${employeur.nom}`,
      data: { type: 'contrat-travail', contratId: String(contrat.id) }
    }).catch(() => {});

    return {
      success: true,
      message: 'Contrat de travail créé avec succès',
      data: contrat
    };

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    logger.error('❌ Erreur creerContrat:', error);
    return { success: false, message: error.message };
  }
}

// ============================================================
  // 🔹 SIGNATURE SALARIÉ
  // ============================================================
  static async signerContrat({ contratId, utilisateurConnecte, signature }) {
    try {
      const contrat = await ContratTravail.findOne({
        where: { id: contratId, salarieId: utilisateurConnecte.id }
      });
      if (!contrat) return { success: false, message: 'Contrat introuvable' };
      if (contrat.statut === 'signe') return { success: false, message: 'Ce contrat est déjà signé' };

      const sigSalarieUrl = await uploadSignature(signature);
      await contrat.update({ signature_salarie: sigSalarieUrl, statut: 'signe' });
      await contrat.reload();

      try {
        const employeur = await Utilisateur.findByPk(contrat.employeurId);
        const salarie   = await Utilisateur.findByPk(contrat.salarieId);

        const pdfBuffer = await contratTravailTemplate({
          numero_contrat: contrat.numero_contrat,
          employeur: {
            nom: employeur.nom, prenom: employeur.prenom, email: employeur.email,
            telephone: employeur.telephone, adresse: employeur.adresse,
            nomEntreprise: employeur.nomEntreprise || null,
            signature: contrat.signature_employeur || employeur.signature || null,
          },
          salarie: {
            nom: salarie.nom, prenom: salarie.prenom, email: salarie.email, telephone: salarie.telephone,
            signature: contrat.signature_salarie || null,
          },
          contrat,
        });

        const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-travail', contrat.numero_contrat));
        await ContratTravail.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

        await envoyerEmailContratSigne({
          emailGenerateur: employeur.email,
          emailAutrePartie: salarie.email,
          numero_contrat: contrat.numero_contrat,
          typeDocument: 'Contrat de travail',
          details: [{ label: 'Numéro', value: contrat.numero_contrat }, { label: 'Poste', value: contrat.poste || '—' }],
          pdfBase64: pdfBuffer.toString('base64'),
          nomSignature: employeur.nomEntreprise || `${employeur.prenom} ${employeur.nom}`,
        });

        sendPushToUsers(employeur.id, {
          title: 'SIGN — Contrat signé ✅',
          body: `Votre contrat de travail ${contrat.numero_contrat} a été signé par le salarié`,
          data: { type: 'contrat-travail', contratId: String(contrat.id) }
        }).catch(() => {});
      } catch (e) { logger.error('Post-signature contrat travail:', e); }

      return { success: true, message: 'Contrat signé avec succès' };
    } catch (error) {
      logger.error(error);
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 DÉTAIL D'UN CONTRAT
  // ============================================================
  static async getContratTravailById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await ContratTravail.findOne({
        where: {
          id: contratId,
          [Op.or]: [
            { employeurId: utilisateurConnecte.id },
            { salarieId:   utilisateurConnecte.id }
          ]
        },
        include: [
          {
            model:      Utilisateur,
            as:         'salarie',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse']
          }
        ]
      });

      if (!contrat) {
        return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      }

      return { success: true, data: contrat };

    } catch (error) {
      logger.error('❌ Erreur getContratById:', error);
      return { success: false, message: 'Erreur lors de la récupération du contrat' };
    }
  }

   // ============================================================
  // 🔹 MES CONTRATS (EMPLOYEUR)
  // ============================================================
  static async getMesContrats({ utilisateurConnecte, page, limit }) {
    try {
      const { page: p, limit: l, offset } = paginate(page, limit);

      const { count, rows } = await ContratTravail.findAndCountAll({
        where: { employeurId: utilisateurConnecte.id },
        include: [{ model: Utilisateur, as: 'salarie', attributes: ['id', 'nom', 'prenom', 'email'] }],
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
      return { success: false, message: 'Erreur serveur' };
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerContrat({ contratId }) {
    try {

      const contrat = await ContratTravail.findByPk(contratId);

      if (!contrat || !contrat.contrat_pdf) {
        return { success: false, message: 'PDF introuvable' };
      }

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
      const stats = await ContratTravail.findAll({
        where: { [Op.or]: [{ employeurId: utilisateurConnecte.id }, { salarieId: utilisateurConnecte.id }] },
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

// ============================================================
// 🔧 GÉNÉRATION PDF
// ============================================================
async function generatePDFBuffer(html) {
  const pdf = require('html-pdf');

  return new Promise((resolve, reject) => {
    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}

module.exports = GestionContratTravailService;