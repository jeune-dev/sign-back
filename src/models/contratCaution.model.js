const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContratCaution = sequelize.define('ContratCaution', {

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

  // ── Garantie ──────────────────────────────────────────────────
  montant_garanti: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  duree: {
    type: DataTypes.STRING,
    allowNull: false
  },

  type_caution: {
    type: DataTypes.ENUM('simple', 'solidaire'),
    allowNull: false
  },

  ville_signature: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ── Informations des trois parties ───────────────────────────
  info_creancier: {
    type: DataTypes.JSON,
    allowNull: true
  },

  info_debiteur: {
    type: DataTypes.JSON,
    allowNull: true
  },

  info_caution: {
    type: DataTypes.JSON,
    allowNull: true
  },

  clauses: {
    type: DataTypes.JSON,
    allowNull: true
  },

  // ── PDF + Signatures ──────────────────────────────────────────
  contrat_pdf: {
    type: DataTypes.STRING(255),  
  },

  signature_generateur: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'URL R2 de la signature image (images/signatures/...)'
  },

  signature_autre_partie: {
    type: DataTypes.STRING(255),
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
  tableName: 'ContratCaution',
  timestamps: true
});

module.exports = ContratCaution;
