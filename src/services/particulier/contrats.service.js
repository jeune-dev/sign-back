'use strict';

const { Op } = require('sequelize');
const sequelize = require('../../config/db');
const {
  Utilisateur,
  ContratTravail,
  ContratPrestation,
  ContratPartenariat,
  ContratLocation,
  ReconnaissanceDette,
  Procuration,
  ContratCaution,
  ContratConfidentialite,
  Contrat,
} = require('../../models');

// ── Config par type de contrat ──────────────────────────────────────────────
const CONTRAT_CONFIG = {
  'contrat-travail': {
    model:          ContratTravail,
    foreignKey:     'salarieId',
    signatureField: 'signature_salarie',
    label:          'Contrat de travail',
    peutSigner:     true,
    generatAs:      'employeur',
  },
  'contrat-prestation': {
    model:          ContratPrestation,
    foreignKey:     'autrePartieId',
    signatureField: 'signature_autre_partie',
    label:          'Contrat de prestation',
    peutSigner:     true,
    generatAs:      'generateur',
  },
  'contrat-partenariat': {
    model:          ContratPartenariat,
    foreignKey:     'autrePartieId',
    signatureField: 'signature_autre_partie',
    label:          'Contrat de partenariat',
    peutSigner:     true,
    generatAs:      'generateur',
  },
  'contrat-location': {
    model:          ContratLocation,
    foreignKey:     'autrePartieId',
    signatureField: 'signature_autre_partie',
    label:          'Contrat de location',
    peutSigner:     true,
    generatAs:      'generateur',
  },
  'reconnaissance-dette': {
    model:          ReconnaissanceDette,
    foreignKey:     'autrePartieId',
    signatureField: 'signature_autre_partie',
    label:          'Reconnaissance de dette',
    peutSigner:     true,
    generatAs:      'generateur',
  },
  'procuration': {
    model:          Procuration,
    foreignKey:     'autrePartieId',
    signatureField: 'signature_autre_partie',
    label:          'Procuration',
    peutSigner:     true,
    generatAs:      'generateur',
  },
  'contrat-caution': {
    model:          ContratCaution,
    foreignKey:     'autrePartieId',
    signatureField: 'signature_autre_partie',
    label:          'Contrat de caution',
    peutSigner:     true,
    generatAs:      'generateur',
  },
  'contrat-confidentialite': {
    model:          ContratConfidentialite,
    foreignKey:     'autrePartieId',
    signatureField: 'signature_autre_partie',
    label:          'Accord de confidentialité',
    peutSigner:     true,
    generatAs:      'generateur',
  },
};

// Attributs Utilisateur à inclure (nom seulement, pas de données sensibles)
const UTILISATEUR_ATTRS = ['id', 'prenom', 'nom', 'email', 'nom_entreprise', 'telephone'];
// Exclure le base64 de la liste
const EXCLUDE_PDF = { exclude: ['contrat_pdf', 'signature_generateur', 'signature_salarie', 'signature_autre_partie'] };

class ParticulierContratsService {

  // ============================================================
  // TOUS LES CONTRATS (tous types confondus)
  // ============================================================
  static async getTousContrats({ userId, statut }) {
    const results = [];

    for (const [type, cfg] of Object.entries(CONTRAT_CONFIG)) {
      const where = { [cfg.foreignKey]: userId };
      if (statut === 'signe')      where.statut = 'signe';
      if (statut === 'en_attente') where.statut = 'en_attente';

      const contrats = await cfg.model.findAll({
        where,
        include: [{
          model:      Utilisateur,
          as:         cfg.generatAs,
          attributes: UTILISATEUR_ATTRS,
        }],
        order:      [['createdAt', 'DESC']],
        attributes: { exclude: ['contrat_pdf', 'signature_generateur', 'signature_salarie', 'signature_autre_partie'] },
      });

      contrats.forEach(c => {
        results.push({
          ...c.toJSON(),
          type,
          typeLabel: cfg.label,
          peutSigner: cfg.peutSigner && c.statut === 'en_attente',
        });
      });
    }

    // Contrats bail (lecture seule)
    const baux = await Contrat.findAll({
      include: [{
        model:      Utilisateur,
        through:    { attributes: [] },
        as:         'locataires',
        where:      { id: userId },
        attributes: [],
      }, {
        model:      Utilisateur,
        as:         'bailleur',
        attributes: UTILISATEUR_ATTRS,
      }],
      order:      [['createdAt', 'DESC']],
      attributes: { exclude: ['contrat_pdf', 'signature_bailleur'] },
    });

    baux.forEach(c => {
      results.push({
        ...c.toJSON(),
        type:       'contrat-bail',
        typeLabel:  'Bail immobilier',
        peutSigner: false,
      });
    });

    // Tri global par date décroissante
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return results;
  }

  // ============================================================
  // CONTRATS PAR TYPE
  // ============================================================
  static async getContratsByType({ userId, type, statut, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    // Cas bail
    if (type === 'contrat-bail') {
      const whereStatut = {};
      if (statut === 'en_attente') whereStatut.statut = 'En attente';
      if (statut === 'signe')      whereStatut.statut = 'Actif';

      const { rows, count } = await Contrat.findAndCountAll({
        where:  whereStatut,
        include: [{
          model:      Utilisateur,
          through:    { attributes: [] },
          as:         'locataires',
          where:      { id: userId },
          attributes: [],
        }, {
          model:      Utilisateur,
          as:         'bailleur',
          attributes: UTILISATEUR_ATTRS,
        }],
        order:      [['createdAt', 'DESC']],
        limit,
        offset,
        attributes: { exclude: ['contrat_pdf', 'signature_bailleur'] },
        distinct:   true,
      });

      return {
        contrats: rows.map(c => ({ ...c.toJSON(), type: 'contrat-bail', typeLabel: 'Bail immobilier', peutSigner: false })),
        total:    count,
        page,
        pages:    Math.ceil(count / limit),
      };
    }

    const cfg = CONTRAT_CONFIG[type];
    if (!cfg) throw new Error(`Type inconnu : ${type}`);

    const where = { [cfg.foreignKey]: userId };
    if (statut === 'signe')      where.statut = 'signe';
    if (statut === 'en_attente') where.statut = 'en_attente';

    const { rows, count } = await cfg.model.findAndCountAll({
      where,
      include: [{
        model:      Utilisateur,
        as:         cfg.generatAs,
        attributes: UTILISATEUR_ATTRS,
      }],
      order:      [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['contrat_pdf', 'signature_generateur', 'signature_salarie', 'signature_autre_partie'] },
    });

    return {
      contrats: rows.map(c => ({
        ...c.toJSON(),
        type,
        typeLabel:  cfg.label,
        peutSigner: cfg.peutSigner && c.statut === 'en_attente',
      })),
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  }

  // ============================================================
  // DÉTAIL D'UN CONTRAT
  // ============================================================
  static async getContratDetail({ userId, type, contratId }) {
    if (type === 'contrat-bail') {
      const contrat = await Contrat.findOne({
        where:   { id: contratId },
        include: [{
          model:      Utilisateur,
          through:    { attributes: [] },
          as:         'locataires',
          where:      { id: userId },
          attributes: ['id', 'prenom', 'nom', 'email', 'telephone'],
        }, {
          model:      Utilisateur,
          as:         'bailleur',
          attributes: UTILISATEUR_ATTRS,
        }],
        attributes: { exclude: ['contrat_pdf'] },
      });

      if (!contrat) return null;
      return { ...contrat.toJSON(), type: 'contrat-bail', typeLabel: 'Bail immobilier', peutSigner: false };
    }

    const cfg = CONTRAT_CONFIG[type];
    if (!cfg) throw new Error(`Type inconnu : ${type}`);

    const contrat = await cfg.model.findOne({
      where: { id: contratId, [cfg.foreignKey]: userId },
      include: [{
        model:      Utilisateur,
        as:         cfg.generatAs,
        attributes: UTILISATEUR_ATTRS,
      }],
      attributes: { exclude: ['contrat_pdf'] },
    });

    if (!contrat) return null;

    return {
      ...contrat.toJSON(),
      type,
      typeLabel:  cfg.label,
      peutSigner: cfg.peutSigner && contrat.statut === 'en_attente',
    };
  }

  // ============================================================
  // SIGNER UN CONTRAT
  // ============================================================
  static async signerContrat({ userId, type, contratId, signature }) {
    if (type === 'contrat-bail') {
      return { success: false, error: 'La signature électronique du bail n\'est pas encore disponible.' };
    }

    const cfg = CONTRAT_CONFIG[type];
    if (!cfg) return { success: false, error: `Type inconnu : ${type}` };
    if (!cfg.peutSigner) return { success: false, error: 'Ce type de contrat ne peut pas être signé.' };

    const contrat = await cfg.model.findOne({
      where: { id: contratId, [cfg.foreignKey]: userId },
    });

    if (!contrat) return { success: false, error: 'Contrat introuvable ou non autorisé.' };
    if (contrat.statut === 'signe') return { success: false, error: 'Ce contrat est déjà signé.' };

    const updateData = {
      [cfg.signatureField]: signature,
      statut:               'signe',
    };

    // Champ date de signature selon le type
    if (type === 'contrat-travail') {
      updateData.date_signature = new Date();
    } else {
      updateData.date_signature_dest = new Date();
    }

    await contrat.update(updateData);

    return { success: true, contrat: { id: contrat.id, statut: 'signe', type } };
  }
}

module.exports = ParticulierContratsService;
