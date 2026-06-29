'use strict';

/**
 * Migration de données : promeut alassane@gmail.com en SUPER-ADMIN.
 *
 * - permissions = ['all']  → le middleware requirePermission accorde l'accès à
 *   toutes les ressources (users, contrats, factures, admins…).
 * - role = 'Admin', statut = 'actif' → passe adminMiddleware.
 *
 * S'exécute automatiquement au déploiement (sequelize db:migrate), après la
 * migration qui crée la colonne `permissions`.
 */
const EMAIL = 'alassane@gmail.com';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE utilisateur
          SET permissions = '["all"]'::json,
              role        = 'Admin',
              statut      = 'actif'
        WHERE email = :email`,
      { replacements: { email: EMAIL } }
    );
  },

  async down(queryInterface) {
    // Retour à « accès total implicite » (null) — n'enlève pas l'accès admin.
    await queryInterface.sequelize.query(
      `UPDATE utilisateur SET permissions = NULL WHERE email = :email`,
      { replacements: { email: EMAIL } }
    );
  }
};
