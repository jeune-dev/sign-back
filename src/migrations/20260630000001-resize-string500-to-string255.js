'use strict';

/** Réduit VARCHAR(500) → VARCHAR(255) sur toutes les colonnes URL/signature.
 *  Ces colonnes stockent des URLs R2/S3 (80-150 chars max) — 255 suffit largement.
 *  Aucune perte de données : aucune valeur existante ne dépasse 255 caractères.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const VARCHAR255 = { type: Sequelize.STRING(255), allowNull: true };

    // ── contrat ──────────────────────────────────────────────────────────────
    await queryInterface.changeColumn('Contrats', 'contrat_pdf',         VARCHAR255);
    await queryInterface.changeColumn('Contrats', 'signature_bailleur',  VARCHAR255);
    await queryInterface.changeColumn('Contrats', 'signature_locataire', VARCHAR255);

    // ── contrat_cautions ─────────────────────────────────────────────────────
    await queryInterface.changeColumn('ContratCaution', 'contrat_pdf',              VARCHAR255);
    await queryInterface.changeColumn('ContratCaution', 'signature_generateur',     VARCHAR255);
    await queryInterface.changeColumn('ContratCaution', 'signature_autre_partie',   VARCHAR255);

    // ── contrat_confidentialites ──────────────────────────────────────────────
    await queryInterface.changeColumn('ContratConfidentialite', 'contrat_pdf',            VARCHAR255);
    await queryInterface.changeColumn('ContratConfidentialite', 'signature_generateur',   VARCHAR255);
    await queryInterface.changeColumn('ContratConfidentialite', 'signature_autre_partie', VARCHAR255);

    // ── contrat_locations ────────────────────────────────────────────────────
    await queryInterface.changeColumn('ContratLocation', 'contrat_pdf',            VARCHAR255);
    await queryInterface.changeColumn('ContratLocation', 'signature_generateur',   VARCHAR255);
    await queryInterface.changeColumn('ContratLocation', 'signature_autre_partie', VARCHAR255);

    // ── contrat_partenariats ──────────────────────────────────────────────────
    await queryInterface.changeColumn('ContratPartenariat', 'contrat_pdf',            VARCHAR255);
    await queryInterface.changeColumn('ContratPartenariat', 'signature_generateur',   VARCHAR255);
    await queryInterface.changeColumn('ContratPartenariat', 'signature_autre_partie', VARCHAR255);

    // ── contrat_prestations ───────────────────────────────────────────────────
    await queryInterface.changeColumn('ContratPrestation', 'contrat_pdf',            VARCHAR255);
    await queryInterface.changeColumn('ContratPrestation', 'signature_generateur',   VARCHAR255);
    await queryInterface.changeColumn('ContratPrestation', 'signature_autre_partie', VARCHAR255);

    // ── contrat_travails ──────────────────────────────────────────────────────
    await queryInterface.changeColumn('ContratTravail', 'contrat_pdf',          VARCHAR255);
    await queryInterface.changeColumn('ContratTravail', 'signature_employeur',   VARCHAR255);
    await queryInterface.changeColumn('ContratTravail', 'signature_salarie',     VARCHAR255);

    // ── procurations ──────────────────────────────────────────────────────────
    await queryInterface.changeColumn('Procuration', 'contrat_pdf',            VARCHAR255);
    await queryInterface.changeColumn('Procuration', 'signature_generateur',   VARCHAR255);
    await queryInterface.changeColumn('Procuration', 'signature_autre_partie', VARCHAR255);

    // ── reconnaissance_dettes ─────────────────────────────────────────────────
    await queryInterface.changeColumn('ReconnaissanceDette', 'contrat_pdf',            VARCHAR255);
    await queryInterface.changeColumn('ReconnaissanceDette', 'signature_generateur',   VARCHAR255);
    await queryInterface.changeColumn('ReconnaissanceDette', 'signature_autre_partie', VARCHAR255);

    // ── etat_logements ────────────────────────────────────────────────────────
    await queryInterface.changeColumn('EtatDesLieux', 'etat_des_lieux_pdf',   VARCHAR255);
    await queryInterface.changeColumn('EtatDesLieux', 'signature_bailleur',   VARCHAR255);
    await queryInterface.changeColumn('EtatDesLieux', 'signature_locataire',  VARCHAR255);

    // ── fiche_paies ───────────────────────────────────────────────────────────
    await queryInterface.changeColumn('FichePaie', 'fiche_pdf', VARCHAR255);

    // ── documents ─────────────────────────────────────────────────────────────
    await queryInterface.changeColumn('documents', 'document_pdf', VARCHAR255);

    // ── utilisateur (underscored: true → snake_case en base) ──────────────────
    await queryInterface.changeColumn('utilisateur', 'photo_profil', VARCHAR255);
    await queryInterface.changeColumn('utilisateur', 'logo',         VARCHAR255);
    await queryInterface.changeColumn('utilisateur', 'signature',    VARCHAR255);

    // ── QuittanceLoyer ────────────────────────────────────────────────────────
    await queryInterface.changeColumn('QuittanceLoyer', 'quittance_pdf',      VARCHAR255);
    await queryInterface.changeColumn('QuittanceLoyer', 'signature_bailleur', VARCHAR255);
  },

  async down(queryInterface, Sequelize) {
    const VARCHAR500 = { type: Sequelize.STRING(500), allowNull: true };

    await queryInterface.changeColumn('Contrats', 'contrat_pdf',         VARCHAR500);
    await queryInterface.changeColumn('Contrats', 'signature_bailleur',  VARCHAR500);
    await queryInterface.changeColumn('Contrats', 'signature_locataire', VARCHAR500);

    await queryInterface.changeColumn('ContratCaution', 'contrat_pdf',            VARCHAR500);
    await queryInterface.changeColumn('ContratCaution', 'signature_generateur',   VARCHAR500);
    await queryInterface.changeColumn('ContratCaution', 'signature_autre_partie', VARCHAR500);

    await queryInterface.changeColumn('ContratConfidentialite', 'contrat_pdf',            VARCHAR500);
    await queryInterface.changeColumn('ContratConfidentialite', 'signature_generateur',   VARCHAR500);
    await queryInterface.changeColumn('ContratConfidentialite', 'signature_autre_partie', VARCHAR500);

    await queryInterface.changeColumn('ContratLocation', 'contrat_pdf',            VARCHAR500);
    await queryInterface.changeColumn('ContratLocation', 'signature_generateur',   VARCHAR500);
    await queryInterface.changeColumn('ContratLocation', 'signature_autre_partie', VARCHAR500);

    await queryInterface.changeColumn('ContratPartenariat', 'contrat_pdf',            VARCHAR500);
    await queryInterface.changeColumn('ContratPartenariat', 'signature_generateur',   VARCHAR500);
    await queryInterface.changeColumn('ContratPartenariat', 'signature_autre_partie', VARCHAR500);

    await queryInterface.changeColumn('ContratPrestation', 'contrat_pdf',            VARCHAR500);
    await queryInterface.changeColumn('ContratPrestation', 'signature_generateur',   VARCHAR500);
    await queryInterface.changeColumn('ContratPrestation', 'signature_autre_partie', VARCHAR500);

    await queryInterface.changeColumn('ContratTravail', 'contrat_pdf',          VARCHAR500);
    await queryInterface.changeColumn('ContratTravail', 'signature_employeur',   VARCHAR500);
    await queryInterface.changeColumn('ContratTravail', 'signature_salarie',     VARCHAR500);

    await queryInterface.changeColumn('Procuration', 'contrat_pdf',            VARCHAR500);
    await queryInterface.changeColumn('Procuration', 'signature_generateur',   VARCHAR500);
    await queryInterface.changeColumn('Procuration', 'signature_autre_partie', VARCHAR500);

    await queryInterface.changeColumn('ReconnaissanceDette', 'contrat_pdf',            VARCHAR500);
    await queryInterface.changeColumn('ReconnaissanceDette', 'signature_generateur',   VARCHAR500);
    await queryInterface.changeColumn('ReconnaissanceDette', 'signature_autre_partie', VARCHAR500);

    await queryInterface.changeColumn('EtatDesLieux', 'etat_des_lieux_pdf',  VARCHAR500);
    await queryInterface.changeColumn('EtatDesLieux', 'signature_bailleur',  VARCHAR500);
    await queryInterface.changeColumn('EtatDesLieux', 'signature_locataire', VARCHAR500);

    await queryInterface.changeColumn('FichePaie', 'fiche_pdf', VARCHAR500);

    await queryInterface.changeColumn('documents', 'document_pdf', VARCHAR500);

    await queryInterface.changeColumn('utilisateur', 'photo_profil', VARCHAR500);
    await queryInterface.changeColumn('utilisateur', 'logo',         VARCHAR500);
    await queryInterface.changeColumn('utilisateur', 'signature',    VARCHAR500);

    await queryInterface.changeColumn('QuittanceLoyer', 'quittance_pdf',      VARCHAR500);
    await queryInterface.changeColumn('QuittanceLoyer', 'signature_bailleur', VARCHAR500);
  },
};
