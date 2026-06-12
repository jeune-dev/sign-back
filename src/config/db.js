require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');

function buildSslConfig() {
  // Pas de SSL en local/Docker (DB_SSL_CA vide ou NODE_ENV !== production)
  if (process.env.NODE_ENV !== 'production') return false;
  if (!process.env.DB_SSL_CA || process.env.DB_SSL_CA.trim() === '') return false;

  const ssl = { require: true, rejectUnauthorized: true };
  const raw = process.env.DB_SSL_CA.trim();
  ssl.ca = raw.startsWith('-----') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
  return ssl;
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: buildSslConfig()
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { freezeTableName: true }
  }
);

module.exports = sequelize;
