const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContratPrestation = sequelize.define('ContratPrestation', {

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

  // ── Informations générales ────────────────────────────────────
  titre_contrat: {
    type: DataTypes.STRING,
    allowNull: false
  },

  date_contrat: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  ville_signature: {
    type: DataTypes.STRING,
    allowNull: false
  },

  objet_prestation: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  // ── Détails prestation ────────────────────────────────────────
  type_prestation: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description_mission: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  duree_mission: {
    type: DataTypes.STRING,
    allowNull: false
  },

  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  montant_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  mode_paiement: {
    type: DataTypes.ENUM('Espèces', 'Virement bancaire', 'Mobile Money', 'Chèque', 'ALL', 'Autre'),
    allowNull: false
  },

  // ── Informations détaillées des parties (saisies dans le formulaire) ─
  info_prestataire: {
    type: DataTypes.JSON,
    allowNull: true
  },

  info_client: {
    type: DataTypes.JSON,
    allowNull: true
  },

  // ── Clauses auto-générées ─────────────────────────────────────
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
  tableName: 'ContratPrestation',
  timestamps: true
});

module.exports = ContratPrestation;
