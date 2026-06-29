'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('Contrats');

    if (!tableDesc.signature_bailleur) {
      await queryInterface.addColumn('Contrats', 'signature_bailleur', {
        type:      Sequelize.STRING(500),
        allowNull: true,
        comment:   'URL R2 de la signature du bailleur',
      });
    }
    if (!tableDesc.signature_locataire) {
      await queryInterface.addColumn('Contrats', 'signature_locataire', {
        type:      Sequelize.STRING(500),
        allowNull: true,
        comment:   'URL R2 de la signature du locataire',
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('Contrats');
    if (tableDesc.signature_bailleur)  await queryInterface.removeColumn('Contrats', 'signature_bailleur');
    if (tableDesc.signature_locataire) await queryInterface.removeColumn('Contrats', 'signature_locataire');
  },
};
