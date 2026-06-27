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
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../r2.service');
const envoyerEmailContratSigne = require('./emailContratSigne');

// ── Mapping type → template PDF ──────────────────────────────────────────────
const TEMPLATES = {
  'contrat-travail':        require('../../templates/pdf/contratTravail/contratTravail.template'),
  'contrat-prestation':     require('../../templates/pdf/autresContrats/contratPrestation/contratPrestation.template'),
  'contrat-partenariat':    require('../../templates/pdf/autresContrats/contratPartenariat/contratPartenariat.template'),
  'contrat-location':       require('../../templates/pdf/autresContrats/contratLocation/contratLocation.template'),
  'reconnaissance-dette':   require('../../templates/pdf/autresContrats/reconnaissanceDette/reconnaissanceDette.template'),
  'procuration':            require('../../templates/pdf/autresContrats/procuration/procuration.template'),
  'contrat-caution':        require('../../templates/pdf/autresContrats/contratCaution/contratCaution.template'),
  'contrat-confidentialite':require('../../templates/pdf/autresContrats/contratConfidentialite/contratConfidentialite.template'),
};

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
        peutSigner: c.statut === 'en_attente',
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
      if (statut === 'en_attente') whereStatut.statut = 'en_attente';
      if (statut === 'signe')      whereStatut.statut = 'signe';

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
        contrats: rows.map(c => ({ ...c.toJSON(), type: 'contrat-bail', typeLabel: 'Bail immobilier', peutSigner: c.statut === 'en_attente' })),
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
      return { ...contrat.toJSON(), type: 'contrat-bail', typeLabel: 'Bail immobilier', peutSigner: contrat.statut === 'en_attente' };
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
  // SIGNER UN CONTRAT + REGÉNÉRER PDF + ENVOYER EMAIL
  // ============================================================
  static async signerContrat({ userId, type, contratId, signature }) {
    if (type === 'contrat-bail') {
      return ParticulierContratsService._signerBail({ userId, contratId });
    }

    const cfg = CONTRAT_CONFIG[type];
    if (!cfg) return { success: false, error: `Type inconnu : ${type}` };
    if (!cfg.peutSigner) return { success: false, error: 'Ce type de contrat ne peut pas être signé.' };

    const contrat = await cfg.model.findOne({
      where:   { id: contratId, [cfg.foreignKey]: userId },
      include: [{ model: Utilisateur, as: cfg.generatAs, attributes: UTILISATEUR_ATTRS }],
    });

    if (!contrat) return { success: false, error: 'Contrat introuvable ou non autorisé.' };
    if (contrat.statut === 'signe') return { success: false, error: 'Ce contrat est déjà signé.' };

    const sigUrl = await uploadSignature(signature);
    const updateData = {
      [cfg.signatureField]: sigUrl,
      statut:               'signe',
    };
    // Le contrat de travail stocke la date du signataire dans `date_signature`,
    // les autres types dans `date_signature_dest`.
    updateData[type === 'contrat-travail' ? 'date_signature' : 'date_signature_dest'] = new Date();
    await contrat.update(updateData);

    // ── Régénération PDF avec les deux signatures ─────────────
    setImmediate(() =>
      ParticulierContratsService._regenererEtEnvoyer({ contrat, cfg, type, signature })
        .catch(err => console.error('[signerContrat] Erreur régénération PDF:', err))
    );

    return { success: true, contrat: { id: contrat.id, statut: 'signe', type } };
  }

  // ============================================================
  // SIGNER UN CONTRAT DE BAIL (locataire)
  // ============================================================
  // Le bail (modèle Contrat) suit un schéma distinct des autres contrats :
  // relation many-to-many avec les locataires et aucune colonne de signature
  // dédiée. On reprend ici la logique éprouvée du service professionnel
  // (passage du statut à « signe » après vérification du locataire).
  static async _signerBail({ userId, contratId }) {
    const contrat = await Contrat.findOne({
      where:   { id: contratId },
      include: [{
        model:      Utilisateur,
        as:         'locataires',
        attributes: ['id'],
        through:    { attributes: [] },
      }],
    });

    if (!contrat) return { success: false, error: 'Contrat introuvable ou non autorisé.' };

    const estLocataire = contrat.locataires?.some(l => l.id === userId);
    if (!estLocataire) return { success: false, error: 'Vous n\'êtes pas locataire de ce contrat.' };

    if (contrat.statut === 'signe') return { success: false, error: 'Ce contrat est déjà signé.' };
    if (contrat.statut !== 'en_attente') {
      return { success: false, error: `Ce contrat ne peut pas être signé (statut : ${contrat.statut}).` };
    }

    await contrat.update({ statut: 'signe' });

    return { success: true, contrat: { id: contrat.id, statut: 'signe', type: 'contrat-bail' } };
  }

  // ── Régénération asynchrone (non-bloquante) ──────────────────────────────
  static async _regenererEtEnvoyer({ contrat, cfg, type, signature }) {
    const generateur   = contrat[cfg.generatAs];
    const destinataire = await Utilisateur.findByPk(contrat[cfg.foreignKey],
      { attributes: UTILISATEUR_ATTRS }
    );
    if (!generateur || !destinataire) return;

    // Construire les objets passés au template
    const sigGenerateur   = contrat.signature_generateur || contrat.signature_employeur || null;
    const sigDestinataire = signature; // la signature qu'on vient de recevoir

    let pdfBuffer;
    if (type === 'contrat-travail') {
      pdfBuffer = await TEMPLATES[type]({
        numero_contrat: contrat.numero_contrat,
        employeur: {
          nom:           generateur.nom,
          prenom:        generateur.prenom,
          email:         generateur.email,
          telephone:     generateur.telephone,
          adresse:       generateur.adresse,
          nomEntreprise: generateur.nom_entreprise || null,
          signature:     sigGenerateur,
        },
        salarie: {
          nom:       destinataire.nom,
          prenom:    destinataire.prenom,
          email:     destinataire.email,
          telephone: destinataire.telephone,
          signature: sigDestinataire,
        },
        contrat,
      });
    } else {
      pdfBuffer = await TEMPLATES[type]({
        numero_contrat: contrat.numero_contrat,
        generateur: {
          nom:           generateur.nom,
          prenom:        generateur.prenom,
          email:         generateur.email,
          telephone:     generateur.telephone,
          adresse:       generateur.adresse,
          nomEntreprise: generateur.nom_entreprise || null,
          signature:     sigGenerateur,
        },
        autrePartie: {
          nom:       destinataire.nom,
          prenom:    destinataire.prenom,
          email:     destinataire.email,
          telephone: destinataire.telephone,
          signature: sigDestinataire,
        },
        contrat,
      });
    }

    // Upload vers R2 et mise à jour de la clé en base
    const pdfKey = await uploadPdf(pdfBuffer, makePdfKey(type, contrat.numero_contrat));
    await cfg.model.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

    // Envoi email aux deux parties
    await envoyerEmailContratSigne({
      emailGenerateur:   generateur.email,
      emailDestinataire: destinataire.email,
      numero_contrat:    contrat.numero_contrat,
      typeLabel:         cfg.label,
      pdfBase64:         pdfBuffer.toString('base64'),
    });
  }

  // ============================================================
  // TÉLÉCHARGER LE PDF D'UN CONTRAT (particulier)
  // ============================================================
  static async getPdf({ userId, type, contratId }) {
    if (type === 'contrat-bail') {
      const contrat = await Contrat.findOne({
        where: { id: contratId },
        include: [{
          model:   Utilisateur,
          through: { attributes: [] },
          as:      'locataires',
          where:   { id: userId },
          attributes: [],
        }],
      });
      if (!contrat || !contrat.contrat_pdf) return null;
      const pdfBuffer = await downloadPdf(contrat.contrat_pdf);
      return { pdfBuffer, numero_contrat: contrat.numero_contrat };
    }

    const cfg = CONTRAT_CONFIG[type];
    if (!cfg) return null;

    const contrat = await cfg.model.findOne({
      where: { id: contratId, [cfg.foreignKey]: userId },
    });
    if (!contrat || !contrat.contrat_pdf) return null;

    const pdfBuffer = await downloadPdf(contrat.contrat_pdf);
    return { pdfBuffer, numero_contrat: contrat.numero_contrat };
  }
}

module.exports = ParticulierContratsService;
