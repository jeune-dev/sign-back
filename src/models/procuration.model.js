const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Procuration = sequelize.define('Procuration', {

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

  // ── Détails procuration ───────────────────────────────────────
  objet_procuration: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  pouvoirs_accordes: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  duree: {
    type: DataTypes.STRING,
    allowNull: false
  },

  type_procuration: {
    type: DataTypes.ENUM('générale', 'limitée'),
    allowNull: false
  },

  limites_precises: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  ville_signature: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ── Informations parties ──────────────────────────────────────
  info_mandant: {
    type: DataTypes.JSON,
    allowNull: true
  },

  info_mandataire: {
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
  tableName: 'Procuration',
  timestamps: true
});

module.exports = Procuration;
