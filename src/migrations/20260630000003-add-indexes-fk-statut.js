'use strict';

/** Ajoute des index sur toutes les colonnes de clé étrangère filtrées en
 *  permanence dans les services (WHERE generateurId = ?, WHERE bailleurId = ?...)
 *  ainsi que sur `statut` pour les 9 tables de contrat. Sans ces index, chaque
 *  requête fait un scan complet de la table — l'impact grandit avec le volume.
 *  Aucune donnée n'est modifiée, uniquement la structure (sûr, réversible).
 */
const INDEXES = [
  { table: 'Contrats',             columns: ['bailleurId'] },
  { table: 'Contrats',             columns: ['statut'] },

  { table: 'ContratCaution',       columns: ['generateurId'] },
  { table: 'ContratCaution',       columns: ['autrePartieId'] },
  { table: 'ContratCaution',       columns: ['statut'] },

  { table: 'ContratConfidentialite', columns: ['generateurId'] },
  { table: 'ContratConfidentialite', columns: ['autrePartieId'] },
  { table: 'ContratConfidentialite', columns: ['statut'] },

  { table: 'ContratLocation',      columns: ['generateurId'] },
  { table: 'ContratLocation',      columns: ['autrePartieId'] },
  { table: 'ContratLocation',      columns: ['statut'] },

  { table: 'ContratPartenariat',   columns: ['generateurId'] },
  { table: 'ContratPartenariat',   columns: ['autrePartieId'] },
  { table: 'ContratPartenariat',   columns: ['statut'] },

  { table: 'ContratPrestation',    columns: ['generateurId'] },
  { table: 'ContratPrestation',    columns: ['autrePartieId'] },
  { table: 'ContratPrestation',    columns: ['statut'] },

  { table: 'ContratTravail',       columns: ['employeurId'] },
  { table: 'ContratTravail',       columns: ['salarieId'] },
  { table: 'ContratTravail',       columns: ['statut'] },

  { table: 'Procuration',          columns: ['generateurId'] },
  { table: 'Procuration',          columns: ['autrePartieId'] },
  { table: 'Procuration',          columns: ['statut'] },

  { table: 'ReconnaissanceDette',  columns: ['generateurId'] },
  { table: 'ReconnaissanceDette',  columns: ['autrePartieId'] },
  { table: 'ReconnaissanceDette',  columns: ['statut'] },

  { table: 'QuittanceLoyer',       columns: ['bailleurId'] },
  { table: 'QuittanceLoyer',       columns: ['locataireId'] },

  { table: 'FichePaie',            columns: ['employeurId'] },
  { table: 'FichePaie',            columns: ['salarieId'] },

  { table: 'documents',            columns: ['clientId'] },
  { table: 'documents',            columns: ['professionnelId'] },

  { table: 'document_items',       columns: ['documentId'] },

  { table: 'EtatDesLieux',         columns: ['contratId'] },

  { table: 'device_tokens',        columns: ['utilisateur_id'] },

  { table: 'user_otps',            columns: ['utilisateur_id'] },

  { table: 'ContratLocataires',    columns: ['contratId'] },
  { table: 'ContratLocataires',    columns: ['locataireId'] },
];

module.exports = {
  async up(queryInterface) {
    for (const { table, columns } of INDEXES) {
      await queryInterface.addIndex(table, columns);
    }
  },

  async down(queryInterface) {
    for (const { table, columns } of INDEXES) {
      await queryInterface.removeIndex(table, columns);
    }
  },
};
