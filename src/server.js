require('dotenv').config();
const sequelize = require('./config/db');
const app = require('./app');
const seedAdmin = require('./seeders/adminSeeder');

// Modèles — import via index.js qui définit aussi toutes les associations
const { Utilisateur: User, RefreshToken, UserOtp, DeviceToken } = require('./models/index');

(async () => {
  try {

    // Synchronisation DB — ordre important : parent avant enfant (FK)
    // En production : sync({ force: false }) — jamais alter:true qui peut supprimer des colonnes
    // En développement : sync({ alter: true }) pour appliquer les changements de modèles
    // Sur Render, NODE_ENV doit être défini dans les variables d'environnement du service
    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const syncOptions = isProd ? { force: false } : { alter: true };

    // 1. Table parent sans dépendances
    await User.sync(syncOptions);
    // 2. Tables qui référencent utilisateurs
    await RefreshToken.sync(syncOptions);
    await UserOtp.sync(syncOptions);
    await DeviceToken.sync(syncOptions);
    console.log('✅ Base synchronisée avec succès');

    await seedAdmin();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erreur fatale au démarrage :', err);
    process.exit(1); // Arrêt immédiat — Render redémarre automatiquement le service
  }
})();
