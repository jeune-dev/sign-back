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
  EtatDesLieux,
} = require('../../models');
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../r2.service');
const envoyerEmailContratSigne = require('./emailContratSigne');
const contratBailTemplate = require('../../templates/pdf/contratBail/contratBail.template');
const { sendPushToUsers } = require('../notification.service');

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
const logger = require('../../utils/logger');

class ParticulierContratsService {

  // ============================================================
  // TOUS LES CONTRATS (tous types confondus)
  // ============================================================
  static async getTousContrats({ userId, statut, type: typeFilter }) {
    const results = [];

    // ── Contrats classiques (travail, prestation, etc.) ──────────
    for (const [type, cfg] of Object.entries(CONTRAT_CONFIG)) {
      if (typeFilter && typeFilter !== type) continue;

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

    // ── Contrats de bail (locataire) ─────────────────────────────
    if (!typeFilter || typeFilter === 'contrat-bail') {
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
        attributes: { exclude: ['contrat_pdf', 'signature_bailleur', 'signature_locataire'] },
      });

      const baulStatut = statut;
      baux.forEach(c => {
        if (baulStatut && c.statut !== baulStatut) return;
        results.push({
          ...c.toJSON(),
          type:       'contrat-bail',
          typeLabel:  'Bail immobilier',
          peutSigner: c.statut === 'en_attente',
        });
      });
    }

    // ── États des lieux (locataire) ───────────────────────────────
    if (!typeFilter || typeFilter === 'etat-des-lieux') {
      let etats = [];
      try {
        etats = await EtatDesLieux.findAll({
          include: [{
            model:      Contrat,
            as:         'contrat',
            required:   true,
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
          }],
          order:      [['createdAt', 'DESC']],
          attributes: { exclude: ['etat_des_lieux_pdf', 'signature_bailleur', 'signature_locataire'] },
        });
      } catch (err) {
        logger.error('[getTousContrats] Erreur états des lieux:', err.message);
        // Ne pas bloquer le reste de la liste
      }

      etats.forEach(e => {
        const bailleur = e.contrat?.bailleur || null;
        const isSigne  = e.statut === 'signe';
        if (statut && (statut === 'signe' ? !isSigne : isSigne)) return;
        results.push({
          ...e.toJSON(),
          id:           e.id,
          type:         'etat-des-lieux',
          typeLabel:    'État des lieux',
          peutSigner:   !isSigne,
          estSigne:     isSigne,
          statut:       isSigne ? 'signe' : 'en_attente',
          // champs attendus par le mobile
          numero_contrat:       e.numero_etat_des_lieux,
          generateurNom:        bailleur ? `${bailleur.prenom} ${bailleur.nom}` : null,
          generateurEntreprise: bailleur?.nom_entreprise || null,
        });
      });
    }

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
    if (type === 'etat-des-lieux') {
      // Déléguer au service professionnel qui gère la logique complète
      const EtatLogementService = require('../professionnel/etatLogement/etatLogement.service');
      return EtatLogementService.signerEtatDesLieux({ etatId: contratId, signature });
    }

    if (type === 'contrat-bail') {
      return ParticulierContratsService._signerBail({ userId, contratId, signature });
    }

    const cfg = CONTRAT_CONFIG[type];
    if (!cfg) return { success: false, message: `Type inconnu : ${type}` };
    if (!cfg.peutSigner) return { success: false, message: 'Ce type de contrat ne peut pas être signé.' };

    const contrat = await cfg.model.findOne({
      where:   { id: contratId, [cfg.foreignKey]: userId },
      include: [{ model: Utilisateur, as: cfg.generatAs, attributes: UTILISATEUR_ATTRS }],
    });

    if (!contrat) return { success: false, message: 'Contrat introuvable ou non autorisé.' };
    if (contrat.statut === 'signe') return { success: false, message: 'Ce contrat est déjà signé.' };

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
        .catch(err => logger.error('[signerContrat] Erreur régénération PDF:', err))
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
  static async _signerBail({ userId, contratId, signature }) {
    const contrat = await Contrat.findOne({
      where:   { id: contratId },
      include: [{
        model:      Utilisateur,
        as:         'locataires',
        attributes: UTILISATEUR_ATTRS,
        through:    { attributes: [] },
      }, {
        model:      Utilisateur,
        as:         'bailleur',
        attributes: UTILISATEUR_ATTRS,
      }],
    });

    if (!contrat) return { success: false, message: 'Contrat introuvable ou non autorisé.' };

    const estLocataire = contrat.locataires?.some(l => l.id === userId);
    if (!estLocataire) return { success: false, message: 'Vous n\'êtes pas locataire de ce contrat.' };

    if (contrat.statut === 'signe') return { success: false, message: 'Ce contrat est déjà signé.' };
    if (contrat.statut !== 'en_attente') {
      return { success: false, message: `Ce contrat ne peut pas être signé (statut : ${contrat.statut}).` };
    }

    // Upload signature locataire sur R2
    const sigLocUrl = await uploadSignature(signature);

    // Mise à jour statut en base immédiatement
    await contrat.update({ statut: 'signe', signature_locataire: sigLocUrl });

    // Régénération PDF asynchrone (non-bloquante)
    setImmediate(() =>
      ParticulierContratsService._regenererPdfBail({ contrat, sigLocUrl, signature })
        .catch(err => logger.error('[_signerBail] Erreur régénération PDF:', err))
    );

    // Notifier le bailleur que le locataire a signé
    const locataire = contrat.locataires?.find(l => l.id === userId);
    if (contrat.bailleur?.id) {
      sendPushToUsers(contrat.bailleur.id, {
        title: '✅ Bail signé',
        body: `${locataire ? `${locataire.prenom} ${locataire.nom}` : 'Le locataire'} a signé le contrat de bail ${contrat.numero_contrat}.`,
        data: { type: 'contrat-bail', contratId: String(contrat.id) },
      });
    }

    return { success: true, contrat: { id: contrat.id, statut: 'signe', type: 'contrat-bail' } };
  }

  // ── Régénération PDF bail avec les deux signatures ─────────────────────────
  static async _regenererPdfBail({ contrat, sigLocUrl, signature }) {
    const bailleur   = contrat.bailleur;
    const locataires = contrat.locataires || [];

    // Résoudre signature bailleur : URL R2 ou profil
    let sigBailleurUrl = contrat.signature_bailleur || bailleur?.signature || null;

    const pdfBuffer = await contratBailTemplate({
      numero_contrat: contrat.numero_contrat,
      bailleur: {
        nom:               bailleur?.nom,
        prenom:            bailleur?.prenom,
        email:             bailleur?.email,
        telephone:         bailleur?.telephone,
        adresse:           bailleur?.adresse,
        cni:               bailleur?.carte_identite_national_num,
        nomEntreprise:     bailleur?.nom_entreprise || null,
        signature:         sigBailleurUrl,
      },
      locataires: locataires.map(l => ({
        nom:       l.nom,
        prenom:    l.prenom,
        email:     l.email,
        telephone: l.telephone,
        adresse:   l.adresse,
        cni:       l.carte_identite_national_num,
        nomEntreprise: l.nom_entreprise || null,
      })),
      bien: {
        adresse:       contrat.bien_adresse,
        ville:         contrat.bien_ville         || null,
        code_postal:   contrat.bien_code_postal   || null,
        pays:          contrat.bien_pays          || 'Sénégal',
        type:          contrat.bien_type,
        superficie:    contrat.bien_superficie    || null,
        nombre_pieces: contrat.bien_nombre_pieces || null,
        etage:         contrat.bien_etage         !== undefined ? contrat.bien_etage : null,
        meuble:        contrat.bien_meuble,
        parking:       contrat.bien_parking,
        cave:          contrat.bien_cave,
        balcon_terrasse: contrat.bien_balcon_terrasse,
      },
      bail: {
        date_debut:     contrat.bail_date_debut ? new Date(contrat.bail_date_debut).toLocaleDateString('fr-FR') : null,
        date_fin:       contrat.bail_date_fin   ? new Date(contrat.bail_date_fin).toLocaleDateString('fr-FR')   : null,
        duree_mois:     contrat.bail_duree_mois     || null,
        duree_annees:   contrat.bail_duree_annees   || null,
        renouvellement: contrat.bail_renouvellement,
        preavis_mois:   contrat.bail_preavis_mois   || 3,
        type_bail:      contrat.bail_type_bail      || null,
      },
      paiement: {
        montant_loyer:   Number(contrat.paiement_montant_loyer)   || 0,
        montant_charges: Number(contrat.paiement_montant_charges) || 0,
        jour_paiement:   contrat.paiement_jour_paiement           || 1,
        periodicite:     contrat.paiement_periodicite             || 'Mensuel',
        moyen:           contrat.paiement_moyen                   || null,
      },
      depot_garantie: {
        prevu:   contrat.depot_garantie_prevu,
        montant: Number(contrat.depot_garantie_montant) || 0,
      },
      clauses: {
        sous_location:  contrat.sous_location_autorisee   ? 'Autorisée'             : 'Non autorisée',
        animaux:        contrat.animaux_autorises          ? 'Autorisés'             : 'Non autorisés',
        travaux:        contrat.travaux_sans_autorisation  ? 'Autorisés sans accord' : 'Soumis à autorisation préalable écrite',
        personnalisees: contrat.clauses_particulieres || null,
      },
      signature: {
        ville:         contrat.signature_ville || null,
        date:          contrat.signature_date  ? new Date(contrat.signature_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
        nom_bailleur:  contrat.signature_nom_bailleur  || `${bailleur?.prenom} ${bailleur?.nom}`,
        nom_locataire: contrat.signature_nom_locataire || locataires.map(l => `${l.prenom} ${l.nom}`).join(', '),
      },
      signature_locataire: sigLocUrl,
    });

    const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-bail', contrat.numero_contrat));
    await Contrat.update({ contrat_pdf: pdfKey }, { where: { id: contrat.id } });

    // Emails aux deux parties
    if (bailleur?.email || locataires.some(l => l.email)) {
      await envoyerEmailContratSigne({
        emailGenerateur:   bailleur?.email,
        emailDestinataire: locataires.map(l => l.email).filter(Boolean)[0] || null,
        numero_contrat:    contrat.numero_contrat,
        typeLabel:         'Contrat de bail immobilier',
        pdfBase64:         pdfBuffer.toString('base64'),
      });
    }
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
    if (type === 'etat-des-lieux') {
      const etat = await EtatDesLieux.findOne({
        where:   { id: contratId },
        include: [{
          model:    Contrat,
          as:       'contrat',
          required: true,
          include:  [{
            model:   Utilisateur,
            as:      'locataires',
            through: { attributes: [] },
            where:   { id: userId },
            attributes: [],
          }],
        }],
      });
      if (!etat || !etat.etat_des_lieux_pdf) return null;
      const pdfBuffer = await downloadPdf(etat.etat_des_lieux_pdf);
      return { pdfBuffer, numero_contrat: etat.numero_etat_des_lieux };
    }

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
