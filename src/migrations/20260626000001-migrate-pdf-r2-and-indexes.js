'use strict';

/**
 * Migration : stockage PDF base64 → clés R2 + indexes manquants
 *
 * Changements :
 *  1. utilisateur  : logo TEXT(long)→VARCHAR(500), emailEntreprise UNIQUE,
 *                    index sur role, index sur statut
 *  2. refresh_tokens : index composite (utilisateur_id, expires_at)
 *  3. Contrats (14 tables) : champ *_pdf TEXT(long)→VARCHAR(500)
 *
 * ⚠️  Cette migration suppose que les lignes existantes en base ont déjà
 *     leurs PDFs et logos migrés vers R2. Les colonnes TEXT seront tronquées
 *     à 500 caractères. Nettoyer les données AVANT de lancer cette migration.
 */

module.exports = {
  async up(queryInterface, Sequelize) {

    // ── 1. TABLE utilisateur ────────────────────────────────────────────────

    await queryInterface.changeColumn('utilisateur', 'logo', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'URL R2 du logo entreprise'
    });

    // Contrainte UNIQUE sur emailEntreprise (ignore si déjà présente)
    try {
      await queryInterface.addConstraint('utilisateur', {
        fields: ['email_entreprise'],
        type: 'unique',
        name: 'utilisateur_email_entreprise_unique'
      });
    } catch (_) { /* contrainte déjà présente */ }

    // Index sur role
    try {
      await queryInterface.addIndex('utilisateur', ['role'], {
        name: 'idx_utilisateur_role'
      });
    } catch (_) {}

    // Index sur statut
    try {
      await queryInterface.addIndex('utilisateur', ['statut'], {
        name: 'idx_utilisateur_statut'
      });
    } catch (_) {}

    // ── 2. TABLE refresh_tokens ────────────────────────────────────────────

    try {
      await queryInterface.addIndex('refresh_tokens', ['utilisateur_id', 'expires_at'], {
        name: 'idx_refresh_tokens_user_expires'
      });
    } catch (_) {}

    // ── 3. TABLES contrats — champs *_pdf ─────────────────────────────────

    const pdfColumns = [
      { table: 'Contrats',              column: 'contrat_pdf' },
      { table: 'ContratTravail',        column: 'contrat_pdf' },
      { table: 'FichePaie',             column: 'fiche_pdf'   },
      { table: 'QuittanceLoyer',        column: 'quittance_pdf' },
      { table: 'ContratPrestation',     column: 'contrat_pdf' },
      { table: 'ContratCaution',        column: 'contrat_pdf' },
      { table: 'EtatDesLieux',          column: 'etat_des_lieux_pdf' },
      { table: 'documents',             column: 'document_pdf' },
      { table: 'ContratConfidentialite',column: 'contrat_pdf' },
      { table: 'Procuration',           column: 'contrat_pdf' },
      { table: 'ContratLocation',       column: 'contrat_pdf' },
      { table: 'ContratPartenariat',    column: 'contrat_pdf' },
      { table: 'ReconnaissanceDette',   column: 'contrat_pdf' },
    ];

    for (const { table, column } of pdfColumns) {
      await queryInterface.changeColumn(table, column, {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Clé R2 du PDF stocké sur Cloudflare R2'
      });
    }

    // ── 4. CHAMPS SIGNATURE — TEXT → VARCHAR(500) URL R2 ──────────────────

    const signatureColumns = [
      { table: 'ContratCaution',         columns: ['signature_generateur', 'signature_autre_partie'] },
      { table: 'ContratConfidentialite', columns: ['signature_generateur', 'signature_autre_partie'] },
      { table: 'ContratLocation',        columns: ['signature_generateur', 'signature_autre_partie'] },
      { table: 'ContratPartenariat',     columns: ['signature_generateur', 'signature_autre_partie'] },
      { table: 'ContratPrestation',      columns: ['signature_generateur', 'signature_autre_partie'] },
      { table: 'Procuration',            columns: ['signature_generateur', 'signature_autre_partie'] },
      { table: 'ReconnaissanceDette',    columns: ['signature_generateur', 'signature_autre_partie'] },
      { table: 'ContratTravail',         columns: ['signature_employeur', 'signature_salarie'] },
      { table: 'EtatDesLieux',           columns: ['signature_bailleur', 'signature_locataire'] },
      { table: 'QuittanceLoyer',         columns: ['signature_bailleur'] },
    ];

    for (const { table, columns } of signatureColumns) {
      for (const col of columns) {
        await queryInterface.changeColumn(table, col, {
          type: Sequelize.STRING(500),
          allowNull: true,
          comment: 'URL R2 de la signature image (images/signatures/...)'
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback : restaure TEXT('long') — les données > 500 chars auraient été perdues
    const pdfColumns = [
      { table: 'Contrats',              column: 'contrat_pdf' },
      { table: 'ContratTravail',        column: 'contrat_pdf' },
      { table: 'FichePaie',             column: 'fiche_pdf'   },
      { table: 'QuittanceLoyer',        column: 'quittance_pdf' },
      { table: 'ContratPrestation',     column: 'contrat_pdf' },
      { table: 'ContratCaution',        column: 'contrat_pdf' },
      { table: 'EtatDesLieux',          column: 'etat_des_lieux_pdf' },
      { table: 'documents',             column: 'document_pdf' },
      { table: 'ContratConfidentialite',column: 'contrat_pdf' },
      { table: 'Procuration',           column: 'contrat_pdf' },
      { table: 'ContratLocation',       column: 'contrat_pdf' },
      { table: 'ContratPartenariat',    column: 'contrat_pdf' },
      { table: 'ReconnaissanceDette',   column: 'contrat_pdf' },
    ];

    for (const { table, column } of pdfColumns) {
      await queryInterface.changeColumn(table, column, {
        type: Sequelize.TEXT('long'),
        allowNull: true
      });
    }

    await queryInterface.changeColumn('utilisateur', 'logo', {
      type: Sequelize.TEXT('long'),
      allowNull: true
    });

    try { await queryInterface.removeConstraint('utilisateur', 'utilisateur_email_entreprise_unique'); } catch (_) {}
    try { await queryInterface.removeIndex('utilisateur', 'idx_utilisateur_role'); } catch (_) {}
    try { await queryInterface.removeIndex('utilisateur', 'idx_utilisateur_statut'); } catch (_) {}
    try { await queryInterface.removeIndex('refresh_tokens', 'idx_refresh_tokens_user_expires'); } catch (_) {}
  }
};
