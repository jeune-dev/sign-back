const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_facture: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  delais_execution: {
    type: DataTypes.STRING
  },
  date_execution: {
    type: DataTypes.DATE
  },
  avance: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: { min: 0 }
  },
  montant_paye: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: { min: 0 }
  },
  lieu_execution: {
    type: DataTypes.STRING
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 }
  },
  moyen_paiement: {
    type: DataTypes.ENUM('ESPECES', 'ORANGE MONEY', 'WAVE', 'CARTE BANCAIRE', 'CHEQUE', 'VIREMENT'),
    defaultValue: 'ESPECES'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  tva: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isIn: [[0, 10, 18]]
    }
  },
  professionnelId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  document_pdf: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'partiel', 'payee'),
    defaultValue: 'en_attente',
    allowNull: false
  }

}, {
  tableName: 'documents',
  timestamps: true
});

module.exports = Document;
