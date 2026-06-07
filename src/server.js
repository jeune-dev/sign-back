require('dotenv').config();
const sequelize = require('./config/db');
const app = require('./app');
const seedAdmin = require('./seeders/adminSeeder');
const clearContratTravail = require('./seeders/clearContratTravail');

// Modèles
const User = require('./models/utilisateur.model');

(async () => {
  try {
    // Suppression des ContratTravail avant migration (colonne jour_travail TEXT → JSON)
    await clearContratTravail();

    // Synchronisation DB
    await sequelize.sync({ alter: true });
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
