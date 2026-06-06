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
      const counts = await Promise.all([
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

      return {
        message: "Nombre total de contrats générés",
        totalContrats: counts.reduce((acc, c) => acc + c, 0)
      };
    } catch (error) {
      console.error("Erreur lors du comptage des contrats :", error);
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
      console.error("Erreur lors de la consultation du contrat :", error);
      throw error;
    }
  }

  // -------------------- LISTE DE TOUS LES CONTRATS --------------------
  static async listeContrats({ page, limit } = {}) {
    try {
      const { page: p, limit: l, offset } = paginate(page, limit);

      const [
        prestations,
        partenariats,
        locations,
        dettes,
        procurations,
        cautions,
        confidentialites,
        travaux,
        baux
      ] = await Promise.all([
        ContratPrestation.findAll({
          include: INCLUDE_GEN_AUTRE,
          order: [['createdAt', 'DESC']]
        }),
        ContratPartenariat.findAll({
          include: INCLUDE_GEN_AUTRE,
          order: [['createdAt', 'DESC']]
        }),
        ContratLocation.findAll({
          include: INCLUDE_GEN_AUTRE,
          order: [['createdAt', 'DESC']]
        }),
        ReconnaissanceDette.findAll({
          include: INCLUDE_GEN_AUTRE,
          order: [['createdAt', 'DESC']]
        }),
        Procuration.findAll({
          include: INCLUDE_GEN_AUTRE,
          order: [['createdAt', 'DESC']]
        }),
        ContratCaution.findAll({
          include: INCLUDE_GEN_AUTRE,
          order: [['createdAt', 'DESC']]
        }),
        ContratConfidentialite.findAll({
          include: INCLUDE_GEN_AUTRE,
          order: [['createdAt', 'DESC']]
        }),
        ContratTravail.findAll({
          order: [['createdAt', 'DESC']]
        }),
        Contrat.findAll({
          include: [
            { model: Utilisateur, as: 'bailleur',   attributes: USER_ATTRS },
            { model: Utilisateur, through: { attributes: [] }, as: 'locataires', attributes: USER_ATTRS }
          ],
          order: [['createdAt', 'DESC']]
        })
      ]);

      const tous = [
        ...normaliserContrats(prestations,      'Contrat de prestation',       'prestation'),
        ...normaliserContrats(partenariats,     'Contrat de partenariat',      'partenariat'),
        ...normaliserContrats(locations,        'Contrat de location',         'location'),
        ...normaliserContrats(dettes,           'Reconnaissance de dette',     'dette'),
        ...normaliserContrats(procurations,     'Procuration',                 'procuration'),
        ...normaliserContrats(cautions,         'Contrat de caution',          'caution'),
        ...normaliserContrats(confidentialites, 'Contrat de confidentialité',  'confidentialite'),
        ...normaliserContrats(travaux,          'Contrat de travail',          'travail'),
        ...normaliserContrats(baux,             'Contrat de bail immobilier',  'bail')
      ];

      tous.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total      = tous.length;
      const contrats   = tous.slice(offset, offset + l);

      return {
        success: true,
        contrats,
        pagination: { total, totalPages: Math.ceil(total / l), page: p, limit: l }
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats :", error);
      throw error;
    }
  }
}

module.exports = GestionContratService;
