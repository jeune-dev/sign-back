const {
  Contrat,
  ContratTravail,
  ContratPrestation,
  ContratPartenariat,
  ContratLocation,
  ReconnaissanceDette,
  Procuration,
  ContratCaution,
  ContratConfidentialite,
  Utilisateur
} = require('../../models/index');

const paginate = require('../../utils/paginate');

const USER_ATTRS = ['id', 'nom', 'prenom', 'email'];

const logger = require('../../utils/logger');

const INCLUDE_GEN_AUTRE = [
  { model: Utilisateur, as: 'generateur',  attributes: USER_ATTRS },
  { model: Utilisateur, as: 'autrePartie', attributes: USER_ATTRS }
];

function normaliserContrats(rows, type, typeCode) {
  return rows.map(c => ({
    id:             c.id,
    numero_contrat: c.numero_contrat,
    type,
    typeCode,
    statut:         c.statut,
    contrat_pdf:    c.contrat_pdf,
    date:           c.date_contrat || c.date_debut || c.date_debut_bail || c.createdAt,
    partie1:        c.generateur  || c.bailleur   || null,
    partie2:        c.autrePartie || (c.locataires && c.locataires[0]) || null,
    createdAt:      c.createdAt
  }));
}

class GestionContratService {

  // -------------------- NOMBRE TOTAL DE CONTRATS --------------------
  static async nombreTotalContrats() {
    try {
      const results = await Promise.allSettled([
        ContratPrestation.count(),
        ContratPartenariat.count(),
        ContratLocation.count(),
        ReconnaissanceDette.count(),
        Procuration.count(),
        ContratCaution.count(),
        ContratConfidentialite.count(),
        ContratTravail.count(),
        Contrat.count()
      ]);

      const totalContrats = results.reduce((acc, r) => {
        return acc + (r.status === 'fulfilled' ? r.value : 0);
      }, 0);

      return { message: "Nombre total de contrats générés", totalContrats };
    } catch (error) {
      logger.error("Erreur lors du comptage des contrats :", error);
      throw error;
    }
  }

  // -------------------- CONSULTER UN CONTRAT PAR TYPE ET ID --------------------
  static async consulterContrat(type, id) {
    const MODELS = {
      prestation:      ContratPrestation,
      partenariat:     ContratPartenariat,
      location:        ContratLocation,
      dette:           ReconnaissanceDette,
      procuration:     Procuration,
      caution:         ContratCaution,
      confidentialite: ContratConfidentialite,
      travail:         ContratTravail,
      bail:            Contrat
    };

    try {
      const Model = MODELS[type];
      if (!Model) throw new Error("Type de contrat invalide");

      const contrat = await Model.findByPk(id);
      if (!contrat) throw new Error("Contrat introuvable");

      return {
        message: "Contrat trouvé avec succès",
        contrat
      };
    } catch (error) {
      logger.error("Erreur lors de la consultation du contrat :", error);
      throw error;
    }
  }

  // -------------------- LISTE DE TOUS LES CONTRATS --------------------
  static async listeContrats({ page, limit } = {}) {
    try {
      const { page: p, limit: l, offset } = paginate(page, limit);

      const QUERIES = [
        { label: 'prestation',      type: 'Contrat de prestation',      typeCode: 'prestation',      fn: () => ContratPrestation.findAll({ include: INCLUDE_GEN_AUTRE, order: [['createdAt', 'DESC']] }) },
        { label: 'partenariat',     type: 'Contrat de partenariat',     typeCode: 'partenariat',     fn: () => ContratPartenariat.findAll({ include: INCLUDE_GEN_AUTRE, order: [['createdAt', 'DESC']] }) },
        { label: 'location',        type: 'Contrat de location',        typeCode: 'location',        fn: () => ContratLocation.findAll({ include: INCLUDE_GEN_AUTRE, order: [['createdAt', 'DESC']] }) },
        { label: 'dette',           type: 'Reconnaissance de dette',    typeCode: 'dette',           fn: () => ReconnaissanceDette.findAll({ include: INCLUDE_GEN_AUTRE, order: [['createdAt', 'DESC']] }) },
        { label: 'procuration',     type: 'Procuration',                typeCode: 'procuration',     fn: () => Procuration.findAll({ include: INCLUDE_GEN_AUTRE, order: [['createdAt', 'DESC']] }) },
        { label: 'caution',         type: 'Contrat de caution',         typeCode: 'caution',         fn: () => ContratCaution.findAll({ include: INCLUDE_GEN_AUTRE, order: [['createdAt', 'DESC']] }) },
        { label: 'confidentialite', type: 'Contrat de confidentialité', typeCode: 'confidentialite', fn: () => ContratConfidentialite.findAll({ include: INCLUDE_GEN_AUTRE, order: [['createdAt', 'DESC']] }) },
        { label: 'travail',         type: 'Contrat de travail',         typeCode: 'travail',         fn: () => ContratTravail.findAll({ order: [['createdAt', 'DESC']] }) },
        { label: 'bail',            type: 'Contrat de bail immobilier', typeCode: 'bail',            fn: () => Contrat.findAll({ include: [{ model: Utilisateur, as: 'bailleur', attributes: USER_ATTRS }, { model: Utilisateur, as: 'locataires', attributes: USER_ATTRS, through: { attributes: [] } }], order: [['createdAt', 'DESC']] }) },
      ];

      const results = await Promise.allSettled(QUERIES.map(q => q.fn()));

      const tous = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          tous.push(...normaliserContrats(result.value, QUERIES[i].type, QUERIES[i].typeCode));
        } else {
          logger.error(`[listeContrats] Erreur sur "${QUERIES[i].label}" :`, result.reason?.message || result.reason);
        }
      });

      tous.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total    = tous.length;
      const contrats = tous.slice(offset, offset + l);

      return {
        success: true,
        contrats,
        pagination: { total, totalPages: Math.ceil(total / l), page: p, limit: l }
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des contrats :", error);
      throw error;
    }
  }
}

module.exports = GestionContratService;
