const Document       = require('./document.model');
const Utilisateur    = require('./utilisateur.model');
const DocumentItem   = require('./documentItem.model');
const Contrat        = require('./contrat.model');
const ContratTravail = require('./contratTravail.model');
const QuittanceLoyer = require('./quittanceLoyer.model');
const EtatDesLieux = require('./etatLogement.model');
const FichePaie      = require('./fichePaie.model');

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
Utilisateur.hasMany(ContratTravail, { foreignKey: 'employeurId', as: 'contrats_employeur' });

// ── Fiche de paie ──────────────────────────────────────────────
FichePaie.belongsTo(Utilisateur, { foreignKey: 'employeurId', as: 'employeur' });
Utilisateur.hasMany(FichePaie,   { foreignKey: 'employeurId', as: 'fiches_paie' });

module.exports = {
  Document,
  DocumentItem,
  ContratTravail,
  QuittanceLoyer,
  EtatDesLieux,
  FichePaie,
  Utilisateur,
  Contrat
};