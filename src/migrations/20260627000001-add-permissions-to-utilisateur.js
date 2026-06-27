'use strict';

/**
 * Migration : ajoute la colonne `permissions` à la table utilisateur.
 *
 * Permet d'attribuer des permissions granulaires aux administrateurs
 * (ex: ['users','contrats','factures','admins']).
 * null = accès total (super-admin / comptes historiques).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('utilisateur', 'permissions', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: "Permissions admin (ex: ['users','contrats','factures','admins']); null = accès total"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('utilisateur', 'permissions');
  }
};
