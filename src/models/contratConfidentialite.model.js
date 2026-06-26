const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContratConfidentialite = sequelize.define('ContratConfidentialite', {

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

  // ── Confidentialité ───────────────────────────────────────────
  type_informations: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  niveau_confidentialite: {
    type: DataTypes.ENUM('faible', 'moyen', 'élevé'),
    allowNull: false
  },

  duree_confidentialite: {
    type: DataTypes.STRING,
    allowNull: false
  },

  sanctions_violation: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  documents_concernes: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  personnes_autorisees: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  ville_signature: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ── Informations parties ──────────────────────────────────────
  info_partie1: {
    type: DataTypes.JSON,
    allowNull: true
  },

  info_partie2: {
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
    allowNull: false,
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
  tableName: 'ContratConfidentialite',
  timestamps: true
});

module.exports = ContratConfidentialite;
