const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ReconnaissanceDette = sequelize.define('ReconnaissanceDette', {

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

  // ── Dette ─────────────────────────────────────────────────────
  montant: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  devise: {
    type: DataTypes.ENUM('FCFA', 'EUR', 'USD'),
    defaultValue: 'FCFA',
    allowNull: false
  },

  motif_dette: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  date_limite_remboursement: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  remboursement_echelonne: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  nombre_echeances: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  montant_par_echeance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  frequence_paiements: {
    type: DataTypes.STRING,
    allowNull: true
  },

  ville_signature: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ── Informations parties ──────────────────────────────────────
  info_debiteur: {
    type: DataTypes.JSON,
    allowNull: true
  },

  info_creancier: {
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
  tableName: 'ReconnaissanceDette',
  timestamps: true
});

module.exports = ReconnaissanceDette;
