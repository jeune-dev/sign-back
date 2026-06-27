/**
 * cleanupLegacyPdf.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Met à NULL les champs PDF qui contiennent un ancien base64 (tronqué/corrompu)
 * au lieu d'une clé R2 valide. Après nettoyage, l'UI affiche proprement
 * « Aucun PDF disponible » plutôt qu'une erreur de téléchargement.
 *
 * Une valeur est considérée VALIDE si elle commence par "pdfs/" (clé R2)
 * ou par "http" (URL). Tout le reste est traité comme legacy base64 → NULL.
 *
 * Usage :
 *   node src/scripts/cleanupLegacyPdf.js          # applique le nettoyage
 *   node src/scripts/cleanupLegacyPdf.js --dry    # simulation (ne modifie rien)
 */
require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const {
  Contrat, ContratTravail, ContratPrestation, ContratPartenariat,
  ContratLocation, ReconnaissanceDette, Procuration, ContratCaution,
  ContratConfidentialite, Document,
} = require('../models/index');

const DRY_RUN = process.argv.includes('--dry');

// { modèle, colonne PDF }
const CIBLES = [
  { model: Contrat,                col: 'contrat_pdf' },
  { model: ContratTravail,         col: 'contrat_pdf' },
  { model: ContratPrestation,      col: 'contrat_pdf' },
  { model: ContratPartenariat,     col: 'contrat_pdf' },
  { model: ContratLocation,        col: 'contrat_pdf' },
  { model: ReconnaissanceDette,    col: 'contrat_pdf' },
  { model: Procuration,            col: 'contrat_pdf' },
  { model: ContratCaution,         col: 'contrat_pdf' },
  { model: ContratConfidentialite, col: 'contrat_pdf' },
  { model: Document,               col: 'document_pdf' },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log(`Connexion DB OK — ${DRY_RUN ? 'SIMULATION' : 'NETTOYAGE'}\n`);

    let totalLegacy = 0;

    for (const { model, col } of CIBLES) {
      const rows = await model.findAll({ attributes: ['id', col] });
      const legacy = rows.filter((r) => {
        const v = r[col];
        return v && !v.startsWith('pdfs/') && !v.startsWith('http');
      });

      if (legacy.length && !DRY_RUN) {
        await model.update(
          { [col]: null },
          { where: { id: { [Op.in]: legacy.map((r) => r.id) } } }
        );
      }

      totalLegacy += legacy.length;
      console.log(`${model.name.padEnd(24)} ${legacy.length} PDF legacy${DRY_RUN ? ' (à nettoyer)' : ' nettoyés'}`);
    }

    console.log(`\nTotal : ${totalLegacy} PDF legacy ${DRY_RUN ? 'détectés' : 'mis à NULL'}.`);
    process.exit(0);
  } catch (err) {
    console.error('Erreur cleanupLegacyPdf :', err.message);
    process.exit(1);
  }
})();
