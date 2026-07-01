'use strict';

/** Reverte QuittanceLoyer.observations VARCHAR(500) → TEXT.
 *  Le champ est du texte libre sans limite prévisible — le VARCHAR(500) causait
 *  une erreur "value too long" en production à la création de quittances.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('QuittanceLoyer', 'observations', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('QuittanceLoyer', 'observations', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },
};
