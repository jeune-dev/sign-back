require('dotenv').config();
const sequelize = require('./config/db');
const app = require('./app');
const seedAdmin = require('./seeders/adminSeeder');
const logger = require('./utils/logger');

const { Utilisateur: User, RefreshToken, UserOtp, DeviceToken } = require('./models/index');

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

(async () => {
  try {
    if (isProd) {
      // En production : sync({ force: false }) crée les tables manquantes sans toucher l'existant.
      // Les migrations Sequelize CLI gèrent les ALTER sur schémas déjà déployés.
      await sequelize.sync({ force: false });
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
