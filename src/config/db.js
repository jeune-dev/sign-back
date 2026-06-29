require('dotenv').config();
const { Sequelize } = require('sequelize');

function buildSslConfig() {
  // Pas de SSL si PostgreSQL est sur le même serveur (loopback — DB_SSL_CA vide)
  if (!process.env.DB_SSL_CA || process.env.DB_SSL_CA.trim() === '') return false;

  const ssl = { require: true, rejectUnauthorized: true };
  const raw = process.env.DB_SSL_CA.trim();
  ssl.ca = raw.startsWith('-----') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
  return ssl;
}

const sslConfig = buildSslConfig();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || '127.0.0.1',
    port:    parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,

    dialectOptions: {
      ...(sslConfig ? { ssl: sslConfig } : {}),
      // Timeout de connexion TCP (ms) — évite un hang indéfini si la DB est inaccessible
      connectTimeout: 10000,
    },

    // Pool dimensionné pour un VPS 4 vCPU × max 4 workers PM2
    // max = 5 par worker → 20 connexions max total (PostgreSQL default max=100)
    pool: {
      max:     5,
      min:     1,
      acquire: 30000,
      idle:    10000,
    },

    define: { freezeTableName: true },
  }
);

module.exports = sequelize;
