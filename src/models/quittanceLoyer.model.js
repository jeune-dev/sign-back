const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QuittanceLoyer = sequelize.define('QuittanceLoyer', {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  numero_quittance: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — BAILLEUR
  // ══════════════════════════════════════════════════════════════
  bailleurId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    }
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — LOCATAIRE
  // ══════════════════════════════════════════════════════════════
  locataireId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    }
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — LOGEMENT
  // ══════════════════════════════════════════════════════════════
  adresse_logement: {
    type: DataTypes.STRING,
    allowNull: false
  },

  type_bien: {
    type: DataTypes.ENUM(
      'Appartement',
      'Maison',
      'Studio',
      'Chambre',
      'Local commercial',
      'Autre'
    ),
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — PAIEMENT
  // ══════════════════════════════════════════════════════════════
  mois: {
    type: DataTypes.ENUM(
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ),
    allowNull: false
  },

  annee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  montant_loyer: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  montant_charges: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  montant_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  date_paiement: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  mode_paiement: {
    type: DataTypes.ENUM(
      'Espèces',
      'Virement bancaire',
      'Mobile Money',
      'Chèque',
      'ALL',
      'Autre'
    ),
    allowNull: false
  },

  est_total: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  montant_paye_partiel: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — FINALISATION
  // ══════════════════════════════════════════════════════════════
  ville_emission: {
    type: DataTypes.STRING,
    allowNull: false
  },

  date_emission: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // PDF & SIGNATURE
  // ══════════════════════════════════════════════════════════════
  quittance_pdf: {
    type: DataTypes.STRING(500)
  },

  signature_bailleur: {
    type: DataTypes.STRING(500),
    allowNull: true
  }

}, {
  tableName: 'QuittanceLoyer',
  timestamps: true
});

module.exports = QuittanceLoyer;