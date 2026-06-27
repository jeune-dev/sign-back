const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContratLocation = sequelize.define('ContratLocation', {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  numero_contrat: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  // ── Parties ──────────────────────────────────────────────────
  generateurId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'utilisateur', key: 'id' }
  },

  autrePartieId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'utilisateur', key: 'id' }
  },

  // ── Description du bien ───────────────────────────────────────
  type_bien: {
    type: DataTypes.ENUM('véhicule', 'matériel', 'équipement', 'électronique', 'autre'),
    allowNull: false
  },

  description_bien: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  etat_bien: {
    type: DataTypes.STRING,
    allowNull: false
  },

  valeur_estimee: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  // ── Conditions de location ────────────────────────────────────
  duree_location: {
    type: DataTypes.STRING,
    allowNull: false
  },

  montant_location: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  caution: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  montant_caution: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  ville_signature: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ── Informations parties ──────────────────────────────────────
  info_proprietaire: {
    type: DataTypes.JSON,
    allowNull: true
  },

  info_locataire: {
    type: DataTypes.JSON,
    allowNull: true
  },

  clauses: {
    type: DataTypes.JSON,
    allowNull: true
  },

  // ── PDF + Signatures ──────────────────────────────────────────
  contrat_pdf: {
    type: DataTypes.STRING(500),
  },

  signature_generateur: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL R2 de la signature image (images/signatures/...)'
  },

  signature_autre_partie: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL R2 de la signature image (images/signatures/...)'
  },

  statut: {
    type: DataTypes.ENUM('en_attente', 'signe'),
    defaultValue: 'en_attente',
    allowNull: false
  },

  date_signature_gen: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  date_signature_dest: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  lieu_signature: {
    type: DataTypes.STRING,
    allowNull: true
  }

}, {
  tableName: 'ContratLocation',
  timestamps: true
});

module.exports = ContratLocation;
