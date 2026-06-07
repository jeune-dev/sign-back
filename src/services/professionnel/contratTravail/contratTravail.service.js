const { ContratTravail, Utilisateur } = require('../../../models');
const paginate = require('../../../utils/paginate');
const sequelize         = require('../../../config/db');
const { Op }            = require('sequelize');

const contratTravailTemplate = require('../../../templates/pdf/contratTravail/contratTravail.template');
const envoyerContratTravailEmail = require('./emailFormatContratTravail');

class GestionContratTravailService {

  // ============================================================
  // 🔹 GÉNÉRER NUMÉRO DE CONTRAT
  // ============================================================
  static async genererNumeroContrat() {
    try {
      const annee = new Date().getFullYear();

      const dernierContrat = await ContratTravail.findOne({
        where:      { numero_contrat: { [Op.like]: `CONTRAT-${annee}-%` } },
        order:      [['createdAt', 'DESC']],
        attributes: ['numero_contrat']
      });

      let compteur = 1;
      if (dernierContrat?.numero_contrat) {
        const parts = dernierContrat.numero_contrat.split('-');
        compteur    = parseInt(parts[2], 10) + 1 || 1;
      }

      return `CONTRAT-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      console.error('❌ Erreur genererNumeroContrat:', error);
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
      return { success: false, error: 'Cette employer est introuvable' };
    }

    // ── 2. Récupérer le salarié ─────────────────────────
    const salarie = await Utilisateur.findByPk(salarieId);
    if (!salarie) {
      await transaction.rollback();
      return { success: false, error: 'Salarié introuvable' };
    }

    // ── 3. Validations métier ───────────────────────────────
    if (!data?.poste) {
      await transaction.rollback();
      return { success: false, error: 'Le poste est requis' };
    }

    if (!data?.salaire_mensuel || Number(data.salaire_mensuel) <= 0) {
      await transaction.rollback();
      return { success: false, error: 'Le montant du salaire est invalide' };
    }

    if (data.type_contrat && !['CDI', 'CDD', 'Stage', 'Freelance'].includes(data.type_contrat)) {
      await transaction.rollback();
      return { success: false, error: 'Le type de contrat est invalide' };
    }

    // Validation jour_travail : doit être un tableau non vide
    if (!Array.isArray(data.jour_travail) || data.jour_travail.length === 0) {
      await transaction.rollback();
      return { success: false, error: 'Veuillez ajouter au moins un jour de travail' };
    }

    // Valider que chaque jour a debut et fin au format HH:MM:SS
    for (const j of data.jour_travail) {
      if (!j.jour || !j.debut || !j.fin) {
        await transaction.rollback();
        return { success: false, error: `Jour "${j.jour || '?'}" : heure début et fin obligatoires` };
      }
    }
    // Supprimer heure_debut/fin s'ils ont été envoyés (plus utilisés)
    delete data.heure_debut;
    delete data.heure_fin;

    // ── 4. Numéro de contrat ────────────────────────────────
    const numero_contrat = await this.genererNumeroContrat();

    // ── 5. Création du contrat ──────────────────────────────
    const contrat = await ContratTravail.create({
      numero_contrat,
      employeurId: employeur.id,
      salarieId: salarie.id,

      ...data,
      signature_employeur,
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
        signature:     employeur.signature     || null, // ← signature base64 du profil
      },
      salarie: {
        nom:       salarie.nom,
        prenom:    salarie.prenom,
        email:     salarie.email,
        telephone: salarie.telephone,
      },
      contrat
    });

    // ── 8. Stocker le PDF en base64 ─────────────────────────
    const pdfBase64 = pdfBuffer.toString('base64');

    await ContratTravail.update(
      { contrat_pdf: pdfBase64 },
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
        pdfBase64
      });
      console.log('✅ Emails envoyés avec succès');
    } catch (err) {
      console.error('❌ Erreur lors de l\'envoi des emails :', err);
    }

    return {
      success: true,
      message: 'Contrat de travail créé avec succès',
      data: contrat
    };

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('❌ Erreur creerContrat:', error);
    return { success: false, message: error.message };
  }
}

// ============================================================
  // 🔹 SIGNATURE SALARIÉ
  // ============================================================
  static async signerContrat({
    contratId,
    utilisateurConnecte,
    signature
  }) {
    try {

      const contrat = await ContratTravail.findOne({
        where: {
          id: contratId,
          salarieId: utilisateurConnecte.id
        }
      });

      if (!contrat) {
        return { success: false, message: 'Contrat introuvable' };
      }

      await contrat.update({
        signature_salarie: signature,
        statut: 'signe'
      });

      return {
        success: true,
        message: 'Contrat signé avec succès'
      };

    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 DÉTAIL D'UN CONTRAT
  // ============================================================
  static async getContratTravailById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await ContratTravail.findOne({
        where:   { id: contratId, employeurId: utilisateurConnecte.id },
        include: [
          {
            model:      Utilisateur,
            as:         'salarie',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse']
          }
        ]
      });

      if (!contrat) {
        return { success: false, error: 'Contrat introuvable ou accès non autorisé' };
      }

      return { success: true, data: contrat };

    } catch (error) {
      console.error('❌ Erreur getContratById:', error);
      return { success: false, error: 'Erreur lors de la récupération du contrat' };
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

      return {
        success: true,
        data: {
          pdfBuffer: Buffer.from(contrat.contrat_pdf, 'base64'),
          numero_contrat: contrat.numero_contrat
        }
      };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const stats = await ContratTravail.findAll({
        where: { employeurId: utilisateurConnecte.id },
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