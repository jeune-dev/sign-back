const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContratPartenariat = sequelize.define('ContratPartenariat', {

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

  // ── Détails partenariat ───────────────────────────────────────
  objet_partenariat: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  duree: {
    type: DataTypes.STRING,
    allowNull: false
  },

  responsabilites_partie1: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  responsabilites_partie2: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  contribution_partie1: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  contribution_partie2: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  partage_revenus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  pourcentage_partie1: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },

  pourcentage_partie2: {
    type: DataTypes.DECIMAL(5, 2),
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
    type: DataTypes.TEXT('long'),
    comment: 'PDF encodé en base64'
  },

  signature_generateur: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  signature_autre_partie: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'ContratPartenariat',
  timestamps: true
});

module.exports = ContratPartenariat;
