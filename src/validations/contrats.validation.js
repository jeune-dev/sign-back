const Joi = require('joi');
const { uuid, signatureBase64, paginationQuery } = require('./common');

// ── Partagé ───────────────────────────────────────────────────────────────────

// Corps pour signer un contrat (tous types)
const signerContratSchema = Joi.object({
  signature: signatureBase64.required(),
});

// Query params statut + pagination (particulier)
const contratQuerySchema = Joi.object({
  statut: Joi.string().valid('signe', 'en_attente').optional(),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
}).unknown(true);

// ── autresContrats (7 types partagent le même schéma de création) ─────────────

const creerContratSimpleSchema = Joi.object({
  autrePartieId:       uuid.required(),
  signature_generateur: signatureBase64.required(),
  data:                Joi.object().required(),
});

// ── Contrat de Travail ────────────────────────────────────────────────────────

const creerContratTravailSchema = Joi.object({
  salarieId:          uuid.required(),
  signature_employeur: signatureBase64.required(),
  data: Joi.object({
    poste:            Joi.string().trim().min(1).max(100).required(),
    salaire_mensuel:  Joi.number().positive().required(),
    type_contrat:     Joi.string().valid('CDI', 'CDD', 'Stage', 'Freelance').optional(),
    jour_travail:     Joi.array().items(Joi.object()).min(1).required(),
  }).unknown(true).required(),
});

// ── Fiche de Paie ─────────────────────────────────────────────────────────────

const creerFichePaieSchema = Joi.object({
  salarieId:    uuid.required(),
  mois:         Joi.string().trim().min(2).max(20).required(),
  annee:        Joi.number().integer().min(2000).max(2100).required(),
  salaire_brut: Joi.number().positive().required(),
  type_contrat: Joi.string().valid('CDI', 'CDD', 'Stage', 'Freelance').optional(),
  nombre_heures_supplementaires: Joi.number().min(0).optional(),
  taux_heure_supp: Joi.string().valid('10%', '25%', '50%').optional(),
  prime_transport:      Joi.number().min(0).optional(),
  prime_logement:       Joi.number().min(0).optional(),
  prime_performance:    Joi.number().min(0).optional(),
  prime_exceptionnelle: Joi.number().min(0).optional(),
  autres_primes:        Joi.number().min(0).optional(),
  soumis_ipres: Joi.boolean().optional(),
  soumis_css:   Joi.boolean().optional(),
  soumis_ir:    Joi.boolean().optional(),
  situation_familiale: Joi.string().optional(),
  nombre_enfants:      Joi.number().integer().min(0).optional(),
}).unknown(true);

// ── Quittance de Loyer ────────────────────────────────────────────────────────

const creerQuittanceSchema = Joi.object({
  locataireId:      uuid.required(),
  signature_bailleur: signatureBase64.required(),
  data: Joi.object({
    adresse_logement: Joi.string().trim().min(1).max(300).required(),
    mois:             Joi.string().trim().min(2).max(20).required(),
    montant_loyer:    Joi.number().positive().required(),
  }).unknown(true).required(),
  logementId: Joi.alternatives().try(uuid, Joi.string()).optional(),
});

// ── Etat des Lieux ────────────────────────────────────────────────────────────

const creerEtatDesLieuxSchema = Joi.object({
  date_etat_des_lieux: Joi.string().isoDate().required(),
  heure_visite:        Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  signature_bailleur:  signatureBase64.required(),
  observations_generales: Joi.string().max(2000).optional().allow('', null),
  nombre_salons:    Joi.number().integer().min(0).optional(),
  nombre_chambres:  Joi.number().integer().min(0).optional(),
}).unknown(true);

// ── Document (Génération rapport / facture) ───────────────────────────────────

const creerDocumentSchema = Joi.object({
  clientId:        uuid.required(),
  items:           Joi.array().items(Joi.object()).min(1).required(),
  montant_paye:    Joi.number().min(0).optional(),
  avance:          Joi.number().min(0).optional(),
  tva:             Joi.number().min(0).max(100).optional(),
  moyen_paiement:  Joi.string().max(100).optional().allow('', null),
  lieu_execution:  Joi.string().max(200).optional().allow('', null),
  delais_execution: Joi.string().max(100).optional().allow('', null),
  date_execution:  Joi.string().isoDate().optional().allow('', null),
});

const mettreAJourDocumentSchema = Joi.object({
  avance: Joi.number().min(0).optional(),
  statut: Joi.string().valid('en_attente', 'partiel', 'payee').optional(),
}).or('avance', 'statut');

// ── Admin ─────────────────────────────────────────────────────────────────────

const modifierPermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().valid('users', 'contrats', 'factures', 'admins', 'all'))
    .required(),
});

// ── Contrat Bail Immobilier ───────────────────────────────────────────────────

const creerContratBailSchema = Joi.object({
  locatairesIds:      Joi.array().items(uuid).min(1).required(),
  signature_bailleur: signatureBase64.optional(),
  bien: Joi.object({
    adresse: Joi.string().trim().min(1).max(300).required(),
    type:    Joi.string().required(),
    usage:   Joi.string().required(),
  }).unknown(true).required(),
  bail: Joi.object({
    date_debut: Joi.string().isoDate().required(),
  }).unknown(true).required(),
  paiement: Joi.object({
    montant_loyer: Joi.number().positive().required(),
  }).unknown(true).required(),
}).unknown(true);

const signerContratBailSchema = Joi.object({
  signature: signatureBase64.required(),
});

module.exports = {
  signerContratSchema,
  contratQuerySchema,
  creerContratSimpleSchema,
  creerContratTravailSchema,
  creerFichePaieSchema,
  creerQuittanceSchema,
  creerEtatDesLieuxSchema,
  creerDocumentSchema,
  mettreAJourDocumentSchema,
  modifierPermissionsSchema,
  creerContratBailSchema,
  signerContratBailSchema,
  paginationQuery,
};
