const Document                = require('./document.model');
const Utilisateur             = require('./utilisateur.model');
const DocumentItem            = require('./documentItem.model');
const Contrat                 = require('./contrat.model');
const ContratTravail          = require('./contratTravail.model');
const QuittanceLoyer          = require('./quittanceLoyer.model');
const EtatDesLieux            = require('./etatLogement.model');
const FichePaie               = require('./fichePaie.model');

// ── Autres contrats ────────────────────────────────────────────
const ContratPrestation       = require('./contratPrestation.model');
const ContratPartenariat      = require('./contratPartenariat.model');
const ContratLocation         = require('./contratLocation.model');
const ReconnaissanceDette     = require('./reconnaissanceDette.model');
const Procuration             = require('./procuration.model');
const ContratCaution          = require('./contratCaution.model');
const ContratConfidentialite  = require('./contratConfidentialite.model');

// ── Document ──────────────────────────────────────────────────
Document.belongsTo(Utilisateur, { foreignKey: 'clientId',        as: 'client' });
Document.belongsTo(Utilisateur, { foreignKey: 'professionnelId', as: 'professionnel' });
Document.hasMany(DocumentItem,  { foreignKey: 'documentId',      as: 'items', onDelete: 'CASCADE' });
DocumentItem.belongsTo(Document,{ foreignKey: 'documentId' });

// ── Contrat immobilier ─────────────────────────────────────────
Contrat.belongsTo(Utilisateur,    { foreignKey: 'bailleurId',     as: 'bailleur' });
Contrat.belongsToMany(Utilisateur,{ through: 'ContratLocataires', foreignKey: 'contratId',   as: 'locataires' });
Utilisateur.hasMany(Contrat,      { foreignKey: 'bailleurId',     as: 'contrats' });
Utilisateur.belongsToMany(Contrat,{ through: 'ContratLocataires', foreignKey: 'locataireId', as: 'locations' });

// ── Quittance loyer ────────────────────────────────────────────
QuittanceLoyer.belongsTo(Utilisateur, { foreignKey: 'bailleurId',   as: 'bailleur' });
QuittanceLoyer.belongsTo(Utilisateur, { foreignKey: 'locataireId',  as: 'locataire' });
Utilisateur.hasMany(QuittanceLoyer,   { foreignKey: 'bailleurId',   as: 'quittances_bailleur' });
Utilisateur.hasMany(QuittanceLoyer,   { foreignKey: 'locataireId',  as: 'quittances_locataire' });


// ── Etat Logement ─────────────────────────────────────────
EtatDesLieux.belongsTo(Contrat, {foreignKey: 'contratId',as: 'contrat'});
Contrat.hasMany(EtatDesLieux, {foreignKey: 'contratId',as: 'etats_des_lieux'});

// ── Contrat de travail ─────────────────────────────────────────
ContratTravail.belongsTo(Utilisateur, { foreignKey: 'employeurId', as: 'employeur' });
ContratTravail.belongsTo(Utilisateur, { foreignKey: 'salarieId',   as: 'salarie' });
Utilisateur.hasMany(ContratTravail,   { foreignKey: 'employeurId', as: 'contrats_employeur' });
Utilisateur.hasMany(ContratTravail,   { foreignKey: 'salarieId',   as: 'contrats_salarie' });

// ── Fiche de paie ──────────────────────────────────────────────
FichePaie.belongsTo(Utilisateur, { foreignKey: 'employeurId', as: 'employeur' });
Utilisateur.hasMany(FichePaie,   { foreignKey: 'employeurId', as: 'fiches_paie' });

// ── Contrat de prestation ──────────────────────────────────────
ContratPrestation.belongsTo(Utilisateur, { foreignKey: 'generateurId',  as: 'generateur' });
ContratPrestation.belongsTo(Utilisateur, { foreignKey: 'autrePartieId', as: 'autrePartie' });
Utilisateur.hasMany(ContratPrestation,   { foreignKey: 'generateurId',  as: 'prestations_generees' });
Utilisateur.hasMany(ContratPrestation,   { foreignKey: 'autrePartieId', as: 'prestations_recues' });

// ── Contrat de partenariat ─────────────────────────────────────
ContratPartenariat.belongsTo(Utilisateur, { foreignKey: 'generateurId',  as: 'generateur' });
ContratPartenariat.belongsTo(Utilisateur, { foreignKey: 'autrePartieId', as: 'autrePartie' });
Utilisateur.hasMany(ContratPartenariat,   { foreignKey: 'generateurId',  as: 'partenariats_generes' });
Utilisateur.hasMany(ContratPartenariat,   { foreignKey: 'autrePartieId', as: 'partenariats_recus' });

// ── Contrat de location (hors immobilier) ─────────────────────
ContratLocation.belongsTo(Utilisateur, { foreignKey: 'generateurId',  as: 'generateur' });
ContratLocation.belongsTo(Utilisateur, { foreignKey: 'autrePartieId', as: 'autrePartie' });
Utilisateur.hasMany(ContratLocation,   { foreignKey: 'generateurId',  as: 'locations_generees' });
Utilisateur.hasMany(ContratLocation,   { foreignKey: 'autrePartieId', as: 'locations_recues' });

// ── Reconnaissance de dette ────────────────────────────────────
ReconnaissanceDette.belongsTo(Utilisateur, { foreignKey: 'generateurId',  as: 'generateur' });
ReconnaissanceDette.belongsTo(Utilisateur, { foreignKey: 'autrePartieId', as: 'autrePartie' });
Utilisateur.hasMany(ReconnaissanceDette,   { foreignKey: 'generateurId',  as: 'dettes_generees' });
Utilisateur.hasMany(ReconnaissanceDette,   { foreignKey: 'autrePartieId', as: 'dettes_recues' });

// ── Procuration ────────────────────────────────────────────────
Procuration.belongsTo(Utilisateur, { foreignKey: 'generateurId',  as: 'generateur' });
Procuration.belongsTo(Utilisateur, { foreignKey: 'autrePartieId', as: 'autrePartie' });
Utilisateur.hasMany(Procuration,   { foreignKey: 'generateurId',  as: 'procurations_generees' });
Utilisateur.hasMany(Procuration,   { foreignKey: 'autrePartieId', as: 'procurations_recues' });

// ── Contrat de caution ─────────────────────────────────────────
ContratCaution.belongsTo(Utilisateur, { foreignKey: 'generateurId',  as: 'generateur' });
ContratCaution.belongsTo(Utilisateur, { foreignKey: 'autrePartieId', as: 'autrePartie' });
Utilisateur.hasMany(ContratCaution,   { foreignKey: 'generateurId',  as: 'cautions_generees' });
Utilisateur.hasMany(ContratCaution,   { foreignKey: 'autrePartieId', as: 'cautions_recues' });

// ── Contrat de confidentialité ─────────────────────────────────
ContratConfidentialite.belongsTo(Utilisateur, { foreignKey: 'generateurId',  as: 'generateur' });
ContratConfidentialite.belongsTo(Utilisateur, { foreignKey: 'autrePartieId', as: 'autrePartie' });
Utilisateur.hasMany(ContratConfidentialite,   { foreignKey: 'generateurId',  as: 'confidentialites_generees' });
Utilisateur.hasMany(ContratConfidentialite,   { foreignKey: 'autrePartieId', as: 'confidentialites_recues' });

module.exports = {
  Document,
  DocumentItem,
  ContratTravail,
  QuittanceLoyer,
  EtatDesLieux,
  FichePaie,
  Utilisateur,
  Contrat,
  ContratPrestation,
  ContratPartenariat,
  ContratLocation,
  ReconnaissanceDette,
  Procuration,
  ContratCaution,
  ContratConfidentialite
};
