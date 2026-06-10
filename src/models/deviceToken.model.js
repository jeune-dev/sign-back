const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeviceToken = sequelize.define('DeviceToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  utilisateurId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'utilisateurs', key: 'id' },
    onDelete: 'CASCADE'
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  platform: {
    type: DataTypes.ENUM('android', 'ios', 'web'),
    allowNull: false,
    defaultValue: 'android'
  }
}, {
  tableName: 'device_tokens',
  timestamps: true,
  underscored: true
});

module.exports = DeviceToken;
