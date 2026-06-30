require('dotenv').config();
const sequelize = require('./config/db');
const app = require('./app');
const seedAdmin = require('./seeders/adminSeeder');
const logger = require('./utils/logger');

const { Utilisateur: User, RefreshToken, UserOtp, DeviceToken } = require('./models/index');

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

  // RBAC : garantit l'accès total ['all'] aux SUPER-ADMINS configurés.
  // Le serveur ne lance pas les migrations sequelize-cli (sync + applyMigrations) :
  // on applique donc le grant ici, à chaque démarrage, de façon idempotente.
  // ⚠️ Colonne `permissions` de type JSON → cast `::json` (et non `::jsonb`, qui échouait).
  // Les autres admins conservent leurs permissions (null/[] = restreint) → futurs comptes restreints.
  try {
    const superAdmins = ['alassane@gmail.com', 'admin@gmail.com'];
    if (process.env.ADMIN_EMAIL) superAdmins.push(process.env.ADMIN_EMAIL.trim().toLowerCase());

    const [, meta] = await sequelize.query(
      `UPDATE utilisateur
          SET permissions = '["all"]'::json, role = 'Admin', statut = 'actif'
        WHERE email IN (:emails)`,
      { replacements: { emails: superAdmins } }
    );
    const n = (meta && (meta.rowCount ?? meta.affectedRows)) || 0;
    if (n > 0) logger.info(`RBAC : ${n} super-admin(s) garanti(s) avec permissions=['all']`);
    else logger.warn(`RBAC : aucun super-admin trouvé pour ${superAdmins.join(', ')}`);
  } catch (e) {
    logger.warn('RBAC super-admin : ' + e.message);
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

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Serveur lancé sur le port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    logger.error('Erreur fatale au démarrage', { error: err.message, stack: err.stack });
    process.exit(1);
  }
})();
