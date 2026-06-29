/**
 * grant-superadmin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Donne TOUS les accès (super-admin) à un administrateur.
 *
 * Met `permissions = ['all']` (le middleware requirePermission accorde alors
 * l'accès à toutes les ressources), force `role = 'Admin'` et `statut = 'actif'`.
 *
 * Usage :
 *   node scripts/grant-superadmin.js                      → alassane@gmail.com (défaut)
 *   node scripts/grant-superadmin.js autre@exemple.com    → un autre email
 *
 * S'appuie sur le .env du projet → cible la même base que l'API (PG/Render).
 */

const sequelize = require('../src/config/db');
const Utilisateur = require('../src/models/utilisateur.model');

const email = (process.argv[2] || 'alassane@gmail.com').trim().toLowerCase();

(async () => {
  try {
    await sequelize.authenticate();

    const admin = await Utilisateur.findOne({ where: { email } });
    if (!admin) {
      console.error(`❌ Aucun utilisateur avec l'email « ${email} ».`);
      process.exit(1);
    }

    admin.permissions = ['all']; // accès total (toutes les ressources)
    admin.role = 'Admin';
    admin.statut = 'actif';
    await admin.save();

    console.log('✅ Super-admin configuré :');
    console.log(`   email       : ${admin.email}`);
    console.log(`   role        : ${admin.role}`);
    console.log(`   statut      : ${admin.statut}`);
    console.log(`   permissions : ${JSON.stringify(admin.permissions)}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Échec :', err.message);
    process.exit(1);
  }
})();
