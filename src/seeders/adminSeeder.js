const bcrypt = require('bcryptjs');
const Utilisateur = require('../models/utilisateur.model');
const { bcryptConfig } = require('../config/security');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const motDePasse = process.env.ADMIN_PASSWORD;
  const nom = process.env.ADMIN_NOM || 'Super';
  const prenom = process.env.ADMIN_PRENOM || 'Admin';
  const adresse = process.env.ADMIN_ADRESSE || 'Non renseignée';

  if (!email || !motDePasse) {
    console.warn('⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD non défini — admin par défaut non créé');
    return;
  }

  const exist = await Utilisateur.findOne({ where: { email: email.toLowerCase() } });
  if (exist) {
    console.log('ℹ️  Admin par défaut déjà existant, aucune action effectuée');
    return;
  }

  const hashedPassword = await bcrypt.hash(motDePasse, bcryptConfig.saltRounds);

  await Utilisateur.create({
    nom,
    prenom,
    email: email.toLowerCase(),
    mot_de_passe: hashedPassword,
    adresse,
    role: 'Admin',
    statut: 'actif'
  });

  console.log(`✅ Admin par défaut créé : ${email}`);
}

module.exports = seedAdmin;
