'use strict';

/** Réduit TEXT → VARCHAR(n) sur les champs formulaire à taille bornée.
 *  TEXT force MySQL à stocker la valeur hors-page (off-page storage) et alloue
 *  un buffer max au tri/regroupement en mémoire — coûteux pour de courts champs.
 *  clauses_particulieres et observations_generales restent TEXT (texte libre long).
 */
// Colonnes concernées et leur nouvelle limite — utilisé pour la vérification pré-migration.
const COLUMNS = [
  { table: 'Contrats',                  column: 'bien_description',       limit: 1000 },
  { table: 'Contrats',                  column: 'motif_resiliation',      limit: 500 },
  { table: 'ContratConfidentialite',  column: 'type_informations',      limit: 500 },
  { table: 'ContratConfidentialite',  column: 'sanctions_violation',    limit: 500 },
  { table: 'ContratConfidentialite',  column: 'documents_concernes',    limit: 500 },
  { table: 'ContratConfidentialite',  column: 'personnes_autorisees',   limit: 500 },
  { table: 'ContratPartenariat',      column: 'objet_partenariat',      limit: 1000 },
  { table: 'ContratPartenariat',      column: 'responsabilites_partie1', limit: 1000 },
  { table: 'ContratPartenariat',      column: 'responsabilites_partie2', limit: 1000 },
  { table: 'ContratPartenariat',      column: 'contribution_partie1',   limit: 1000 },
  { table: 'ContratPartenariat',      column: 'contribution_partie2',   limit: 1000 },
  { table: 'ContratPrestation',       column: 'objet_prestation',       limit: 500 },
  { table: 'ContratPrestation',       column: 'description_mission',    limit: 500 },
  { table: 'Procuration',              column: 'objet_procuration',      limit: 500 },
  { table: 'Procuration',              column: 'pouvoirs_accordes',      limit: 1000 },
  { table: 'Procuration',              column: 'limites_precises',       limit: 1000 },
  { table: 'ReconnaissanceDette',     column: 'motif_dette',            limit: 500 },
  { table: 'QuittanceLoyer',          column: 'observations',           limit: 500 },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Vérification pré-migration : aucune valeur existante ne doit dépasser la nouvelle limite ──
    const overflows = [];
    for (const { table, column, limit } of COLUMNS) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT MAX(LENGTH("${column}")) AS "maxLen" FROM "${table}"`
      );
      const maxLen = rows[0]?.maxLen;
      if (maxLen !== null && maxLen > limit) {
        overflows.push(`${table}.${column} : valeur max = ${maxLen} > limite ${limit}`);
      }
    }
    if (overflows.length > 0) {
      throw new Error(
        `Migration annulée — des données dépassent la nouvelle taille VARCHAR :\n${overflows.join('\n')}`
      );
    }

    const VARCHAR500  = { type: Sequelize.STRING(500),  allowNull: true };
    const VARCHAR1000 = { type: Sequelize.STRING(1000), allowNull: true };

    // ── contrats ─────────────────────────────────────────────────────────────
    await queryInterface.changeColumn('Contrats', 'bien_description',  VARCHAR1000);
    await queryInterface.changeColumn('Contrats', 'motif_resiliation', VARCHAR500);

    // ── contrat_confidentialites ────────────────────────────────────────────
    await queryInterface.changeColumn('ContratConfidentialite', 'type_informations',   VARCHAR500);
    await queryInterface.changeColumn('ContratConfidentialite', 'sanctions_violation',  VARCHAR500);
    await queryInterface.changeColumn('ContratConfidentialite', 'documents_concernes',  VARCHAR500);
    await queryInterface.changeColumn('ContratConfidentialite', 'personnes_autorisees', VARCHAR500);

    // ── contrat_partenariats ────────────────────────────────────────────────
    await queryInterface.changeColumn('ContratPartenariat', 'objet_partenariat',      VARCHAR1000);
    await queryInterface.changeColumn('ContratPartenariat', 'responsabilites_partie1', VARCHAR1000);
    await queryInterface.changeColumn('ContratPartenariat', 'responsabilites_partie2', VARCHAR1000);
    await queryInterface.changeColumn('ContratPartenariat', 'contribution_partie1',    VARCHAR1000);
    await queryInterface.changeColumn('ContratPartenariat', 'contribution_partie2',    VARCHAR1000);

    // ── contrat_prestations ─────────────────────────────────────────────────
    await queryInterface.changeColumn('ContratPrestation', 'objet_prestation',     VARCHAR500);
    await queryInterface.changeColumn('ContratPrestation', 'description_mission',  VARCHAR500);

    // ── procurations ─────────────────────────────────────────────────────────
    await queryInterface.changeColumn('Procuration', 'objet_procuration',  VARCHAR500);
    await queryInterface.changeColumn('Procuration', 'pouvoirs_accordes',  VARCHAR1000);
    await queryInterface.changeColumn('Procuration', 'limites_precises',   VARCHAR1000);

    // ── reconnaissance_dettes ───────────────────────────────────────────────
    await queryInterface.changeColumn('ReconnaissanceDette', 'motif_dette', VARCHAR500);

    // ── quittance_loyers ─────────────────────────────────────────────────────
    await queryInterface.changeColumn('QuittanceLoyer', 'observations', VARCHAR500);
  },

  async down(queryInterface, Sequelize) {
    const TEXT = { type: Sequelize.TEXT, allowNull: true };

    await queryInterface.changeColumn('Contrats', 'bien_description',  TEXT);
    await queryInterface.changeColumn('Contrats', 'motif_resiliation', TEXT);

    await queryInterface.changeColumn('ContratConfidentialite', 'type_informations',   TEXT);
    await queryInterface.changeColumn('ContratConfidentialite', 'sanctions_violation',  TEXT);
    await queryInterface.changeColumn('ContratConfidentialite', 'documents_concernes',  TEXT);
    await queryInterface.changeColumn('ContratConfidentialite', 'personnes_autorisees', TEXT);

    await queryInterface.changeColumn('ContratPartenariat', 'objet_partenariat',      TEXT);
    await queryInterface.changeColumn('ContratPartenariat', 'responsabilites_partie1', TEXT);
    await queryInterface.changeColumn('ContratPartenariat', 'responsabilites_partie2', TEXT);
    await queryInterface.changeColumn('ContratPartenariat', 'contribution_partie1',    TEXT);
    await queryInterface.changeColumn('ContratPartenariat', 'contribution_partie2',    TEXT);

    await queryInterface.changeColumn('ContratPrestation', 'objet_prestation',    TEXT);
    await queryInterface.changeColumn('ContratPrestation', 'description_mission', TEXT);

    await queryInterface.changeColumn('Procuration', 'objet_procuration', TEXT);
    await queryInterface.changeColumn('Procuration', 'pouvoirs_accordes', TEXT);
    await queryInterface.changeColumn('Procuration', 'limites_precises',  TEXT);

    await queryInterface.changeColumn('ReconnaissanceDette', 'motif_dette', TEXT);

    await queryInterface.changeColumn('QuittanceLoyer', 'observations', TEXT);
  },
};
