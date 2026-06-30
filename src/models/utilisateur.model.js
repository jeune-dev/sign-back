const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  photoProfil: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  carte_identite_national_num: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Particulier', 'Independant', 'Professionnel'),
    defaultValue: 'Particulier',
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif'),
    defaultValue: 'actif'
  },
  // Permissions accordées à un administrateur (ex: ['users','contrats','factures','admins']).
  // ['all'] = accès total (super-admin, accordé explicitement). null / [] = compte restreint
  // (aucun accès tant qu'aucune permission n'a été accordée).
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  // URL R2 du logo — ex: https://pub-xxx.r2.dev/images/logo_xxx.png
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  rc: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ninea: {
    type: DataTypes.STRING,
    allowNull: true
  },
  signature: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },

  nomEntreprise: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  adresseEntreprise: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telephoneEntreprise: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emailEntreprise: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

}, {
  tableName: 'utilisateur',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { fields: ['role'] },
    { fields: ['statut'] }
  ]
});

module.exports = User;
