const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EtatDesLieux = sequelize.define('EtatDesLieux', {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  numero_etat_des_lieux: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  contratId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Contrats',
      key: 'id'
    }
  },

  date_etat_des_lieux: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  heure_visite: {
    type: DataTypes.TIME,
    allowNull: false
  },

  observations_generales: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  nombre_salons: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  nombre_chambres: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  nombre_cuisines: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  nombre_salles_bain: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  nombre_wc: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  nombre_balcons: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  autres_pieces: {
    type: DataTypes.JSON, 
    allowNull: true
  },

  pieces: {
    type: DataTypes.JSON,
    allowNull: false
  },

  signature_bailleur: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  signature_locataire: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  date_signature: {
    type: DataTypes.DATEONLY
  },

  etat_des_lieux_pdf: {
    type: DataTypes.STRING(255)
  },

  statut: {
    type: DataTypes.ENUM(
      'en_cours',
      'composition_remplie',
      'inspection',
      'valide',
      'signe',
      'termine'
    ),
    defaultValue: 'en_cours',
    allowNull: false
  }

}, {
  tableName: 'EtatDesLieux',
  timestamps: true
});

module.exports = EtatDesLieux;