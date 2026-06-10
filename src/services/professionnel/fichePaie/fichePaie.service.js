const { FichePaie, Utilisateur } = require('../../../models');
const paginate = require('../../../utils/paginate');
const sequelize = require('../../../config/db');
const { Op } = require('sequelize');
const { uploadPdf, downloadPdf, makePdfKey } = require('../../../services/r2.service');
const fichePaieTemplate = require('../../../templates/pdf/fichePaie/fichePaie.template');
const envoyerFichePaieEmail = require('./emailFormatFichePaie');

class GestionFichePaieService {

  static async genererNumeroFiche() {
    const annee = new Date().getFullYear();

    const last = await FichePaie.findOne({
      where: { numero_fiche: { [Op.like]: `FICHE-${annee}-%` } },
      order: [['createdAt', 'DESC']]
    });

    let compteur = 1;

    if (last?.numero_fiche) {
      const parts = last.numero_fiche.split('-');
      compteur = (parseInt(parts[2]) || 0) + 1;
    }

    return `FICHE-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  // ======================================================
  static calculerSalaire(data) {

    const tauxMap = { '10%': 0.10, '25%': 0.25, '50%': 0.50 };
    const taux = tauxMap[data.taux_heure_supp] || 0;

    const salaire_brut = Number(data.salaire_brut || 0);
    const heures_supp = Number(data.nombre_heures_supplementaires || 0);

    const taux_horaire = salaire_brut / 173.33;
    const montant_heures_supp = Math.round(heures_supp * taux_horaire * (1 + taux));

    const total_primes =
      Number(data.prime_transport || 0) +
      Number(data.prime_logement || 0) +
      Number(data.prime_performance || 0) +
      Number(data.prime_exceptionnelle || 0) +
      Number(data.autres_primes || 0);

    const total_gains = salaire_brut + total_primes + montant_heures_supp;

    const ipres = data.soumis_ipres ? total_gains * 0.056 : 0;
    const css = data.soumis_css ? total_gains * 0.03 : 0;

    let ir = 0;
    if (data.soumis_ir) {
      const revenu = total_gains - ipres - css;

      let parts = 1;
      if (data.situation_familiale === 'Marié') parts += 1;
      parts += Math.min((data.nombre_enfants || 0) * 0.5, 2);

      const base = revenu / parts;

      if (base <= 300000) ir = base * 0.10;
      else if (base <= 600000) ir = (300000 * 0.10) + ((base - 300000) * 0.20);
      else ir = (300000 * 0.10) + (300000 * 0.20) + ((base - 600000) * 0.30);

      ir = ir * parts;
    }

    const retenues =
      ipres + css + ir +
      Number(data.montant_assurance || 0) +
      Number(data.montant_avance_salaire || 0) +
      Number(data.montant_retenue || 0);

    const net = total_gains - retenues;

    return {
      total_gains: Math.round(total_gains),
      montant_heures_supp,
      montant_ipres: Math.round(ipres),
      montant_css: Math.round(css),
      montant_ir: Math.round(ir),
      total_retenues: Math.round(retenues),
      salaire_net: Math.round(net)
    };
  }

  static cleanFiche(data) {

    // ===========================
    // PRIMES
    // ===========================
    if (!data.a_primes) {
      data.prime_transport = 0;
      data.prime_logement = 0;
      data.prime_performance = 0;
      data.prime_exceptionnelle = 0;
      data.autres_primes = 0;
    }

    // ===========================
    // HEURES SUP
    // ===========================
    if (!data.a_heures_supp) {
      data.nombre_heures_supplementaires = 0;
    }

    // ===========================
    // AVANCE / RETENUES
    // ===========================
    if (!data.a_avance_salaire) {
      data.montant_avance_salaire = 0;
    }

    if (!data.a_autres_retenues) {
      data.montant_retenue = 0;
      data.motif_retenue = null;
    }

    // ===========================
    // ABSENCE
    // ===========================
    if (!data.absence) {
      data.nombre_jours_absence = 0;
      data.type_absence = null;
      data.autre_type_absence = null;
    }

    // ===========================
    // AVANTAGES (CORRIGÉ)
    // ===========================
    if (data.avantages_nature === "Aucun" || !data.avantages_nature) {
      data.valeur_avantages = 0;
    }

    // ===========================
    // CONGÉS
    // ===========================
    if (!data.conges_pris) {
      data.nombre_jours_conges = 0;
      data.montant_conges = 0;
    }

    // ===========================
    // ASSURANCE
    // ===========================
    if (!data.a_assurance) {
      data.montant_assurance = 0;
    }

    return data;
  }


  static async creerFichePaie({ utilisateurConnecte, salarieId, ...data }) {

    const t = await sequelize.transaction();

    try {

      const employeur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!employeur) throw new Error("Employeur introuvable");

      const salarie = await Utilisateur.findByPk(salarieId);
      if (!salarie) throw new Error("Salarié introuvable");

      const numero_fiche = await this.genererNumeroFiche();

      // 🔥 CLEAN AVANT CALCUL
      data = this.cleanFiche(data);

      const calcul = this.calculerSalaire(data);

      const exist = await FichePaie.findOne({
        where: {
          employeurId: employeur.id,
          salarieId: salarie.id,
          mois: data.mois,
          annee: data.annee
        }
      });

      if (exist) {
        await t.rollback();

        return {
          success: false,
          message: `❌ Une fiche de paie existe déjà pour ${salarie.prenom} ${salarie.nom} sur ${data.mois} ${data.annee}`
        };
      }

      const fiche = await FichePaie.create({
        numero_fiche,
        employeurId: employeur.id,
        salarieId: salarie.id,

        type_contrat: data.type_contrat || 'CDI',
        mois: data.mois,
        annee: data.annee,
        salaire_brut: data.salaire_brut,

        mode_calcul: data.mode_calcul || 'Mensuel',

        // TEMPS TRAVAIL
        nombre_jours_travailles: data.nombre_jours_travailles,
        nombre_heures_travailles: data.nombre_heures_travailles,

        absence: data.absence === true,
        nombre_jours_absence: data.nombre_jours_absence,
        type_absence: data.type_absence,
        autre_type_absence: data.autre_type_absence,

        // HEURES SUP
        a_heures_supp: data.a_heures_supp === true,
        nombre_heures_supplementaires: data.nombre_heures_supplementaires,

        // PRIMES
        a_primes: data.a_primes === true,
        prime_transport: data.prime_transport,
        prime_logement: data.prime_logement,
        prime_performance: data.prime_performance,
        prime_exceptionnelle: data.prime_exceptionnelle,
        autres_primes: data.autres_primes,

        // AVANTAGES
        avantages_nature: data.avantages_nature,
        autre_avantages: data.autre_avantages,
        valeur_avantages: data.valeur_avantages,

        // CONGES
        conges_pris: data.conges_pris || false,
        nombre_jours_conges: data.nombre_jours_conges,
        montant_conges: data.montant_conges,

        // RETENUES
        a_avance_salaire: data.a_avance_salaire || false,
        montant_avance_salaire: data.montant_avance_salaire,

        a_autres_retenues: data.a_autres_retenues || false,
        motif_retenue: data.motif_retenue,
        montant_retenue: data.montant_retenue,

        // COTISATIONS
        soumis_cotisation: data.soumis_cotisation ?? true,
        soumis_ipres: data.soumis_ipres ?? true,
        soumis_css: data.soumis_css ?? true,
        a_assurance: data.a_assurance || false,
        montant_assurance: data.montant_assurance,

        // IMPÔTS
        soumis_ir: data.soumis_ir ?? true,
        situation_familiale: data.situation_familiale || 'Célibataire',
        nombre_enfants: data.nombre_enfants || 0,

        // PAIEMENT
        mode_paiement: data.mode_paiement,
        date_paiement: data.date_paiement,

        // IDENTIFICATION SALARIÉ 
        poste: data.poste || salarie.poste || null,
        date_embauche: data.date_embauche || salarie.date_embauche || null,
        numero_ipres: data.numero_ipres || salarie.numero_ipres || null,
        numero_css: data.numero_css || salarie.numero_css || null,

        // CALCULS AUTO
        ...calcul

      }, { transaction: t });

      await t.commit();

      // ======================
      // PDF DATA ENRICHIE
      // ======================
      const fichePDF = {
        ...fiche.toJSON(),

        nom_entreprise: employeur.nomEntreprise,
        ninea: employeur.ninea,
        adresse_employeur: employeur.adresseEntreprise,
        telephone_employeur: employeur.telephoneEntreprise,
        representant: employeur.prenom + " " + employeur.nom,

        nom_salarie: salarie.nom,
        prenom_salarie: salarie.prenom,
        numero_cni: salarie.carte_identite_national_num,
        email_salarie: salarie.email
      };

      const pdf = await fichePaieTemplate({ fiche: fichePDF });

      const pdfKey = await uploadPdf(pdf, makePdfKey('fiche-paie', numero_fiche));
      fiche.fiche_pdf = pdfKey;
      await fiche.save();

      await envoyerFichePaieEmail({
        emailEmployeur: employeur.email,
        numero_fiche,
        nom: `${salarie.prenom} ${salarie.nom}`,
        mois: data.mois,
        annee: data.annee,
        salaire_net: calcul.salaire_net,
        pdfBase64: pdf.toString('base64')
      });

      return { success: true, data: fiche };

    } catch (err) {
      await t.rollback();
      if (err.name === 'SequelizeUniqueConstraintError') {
        return {
          success: false,
          message: `⚠️ Une fiche de paie existe déjà pour ce salarié sur cette période`
        };
      }
      return { success: false, message: err.message };
    }
  }

  static async getMesFichesPaie({ utilisateurConnecte, page, limit }) {
    const { page: p, limit: l, offset } = paginate(page, limit);

    const { count, rows } = await FichePaie.findAndCountAll({
      where: { employeurId: utilisateurConnecte.id },
      order: [['createdAt', 'DESC']],
      limit: l,
      offset
    });

    return {
      success: true,
      data: rows,
      pagination: { total: count, totalPages: Math.ceil(count / l), page: p, limit: l }
    };
  }

  static async getFichePaieById({ fichePaieId, utilisateurConnecte }) {

    const fiche = await FichePaie.findOne({
      where: {
        id: fichePaieId,
        employeurId: utilisateurConnecte.id
      },
      include: [{ model: Utilisateur, as: 'salarie' }]
    });

    if (!fiche) {
      return { success: false, message: "Introuvable" };
    }

    return { success: true, data: fiche };
  }

  static async telechargerFichePaie({ fichePaieId }) {

    const fiche = await FichePaie.findByPk(fichePaieId);

    if (!fiche?.fiche_pdf) {
      return { success: false };
    }

    const pdfBuffer = await downloadPdf(fiche.fiche_pdf);
    return {
      success: true,
      data: { pdfBuffer, numero_fiche: fiche.numero_fiche }
    };
  }
}

module.exports = GestionFichePaieService;