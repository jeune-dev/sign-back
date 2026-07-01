require('dotenv').config();
const sequelize = require('./config/db');
const app = require('./app');
const seedAdmin = require('./seeders/adminSeeder');
const logger = require('./utils/logger');

const { Utilisateur: User, RefreshToken, UserOtp, DeviceToken } = require('./models/index');
const { startCleanupExpiredTokensJob } = require('./jobs/cleanupExpiredTokens.job');

const isProd = process.env.NODE_ENV === 'production';

// ── Handlers process non capturées ────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: String(reason) });
  process.exit(1);
});

// Arrêt propre sur SIGTERM (PM2 reload, Docker stop)
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu — arrêt propre');
  process.exit(0);
});

/**
 * Applique les migrations de colonnes manquantes de façon idempotente.
 * sync({ force: false }) ne fait pas d'ALTER TABLE — on le fait manuellement ici.
 */
async function applyMigrations() {
  const qi = sequelize.getQueryInterface();

  // Migration : colonne permissions (ajoutée dans refonte dashboard)
  try {
    const cols = await qi.describeTable('utilisateur');
    if (!cols.permissions) {
      await qi.addColumn('utilisateur', 'permissions', {
        type: require('sequelize').DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      });
      logger.info('Migration appliquée : colonne permissions ajoutée à utilisateur');
    }
  } catch (e) {
    logger.warn('Migration permissions : ' + e.message);
  }
}

(async () => {
  try {
    if (isProd) {
      // En production : sync({ force: false }) crée les tables manquantes sans toucher l'existant.
      // applyMigrations() gère les ALTER TABLE (nouvelles colonnes sur tables existantes).
      await sequelize.sync({ force: false });
      await applyMigrations();
      logger.info('Connexion PostgreSQL établie et tables synchronisées (production)');
    } else {
      // En développement : sync({ alter: true }) pour appliquer les modèles localement.
      // Ne jamais utiliser en production — peut supprimer des colonnes silencieusement.
      await User.sync({ alter: true });
      await RefreshToken.sync({ alter: true });
      await UserOtp.sync({ alter: true });
      await DeviceToken.sync({ alter: true });
      logger.info('Base de données synchronisée (mode développement)');
    }

    await seedAdmin();

    startCleanupExpiredTokensJob();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Serveur lancé sur le port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    logger.error('Erreur fatale au démarrage', { error: err.message, stack: err.stack });
    process.exit(1);
  }
})();
