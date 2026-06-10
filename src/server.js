require('dotenv').config();
const sequelize = require('./config/db');
const app = require('./app');
const seedAdmin = require('./seeders/adminSeeder');

// Modèles — import via index.js qui définit aussi toutes les associations
const { Utilisateur: User, RefreshToken, UserOtp, DeviceToken } = require('./models/index');

(async () => {
  try {

    // Synchronisation DB — ordre important : parent avant enfant (FK)
    // 1. Table parent sans dépendances
    await User.sync({ alter: true });
    // 2. Tables qui référencent utilisateurs
    await RefreshToken.sync({ alter: true });
    await UserOtp.sync({ alter: true });
    await DeviceToken.sync({ alter: true });
    console.log('✅ Base synchronisée avec succès');

    await seedAdmin();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erreur lors de la synchronisation de la base :', err);
  }
})();
