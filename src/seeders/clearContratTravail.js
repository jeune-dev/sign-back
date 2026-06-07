const sequelize = require('../config/db');

async function clearContratTravail() {
  // Vérifie si la table existe
  const [[{ tbl }]] = await sequelize.query(
    `SELECT to_regclass('"ContratTravail"') AS tbl`
  );

  if (!tbl) {
    console.log('ℹ️  ContratTravail — table inexistante, sync va la créer');
    return;
  }

  // Supprime toutes les données
  const [[{ count }]] = await sequelize.query(
    'SELECT COUNT(*) AS count FROM "ContratTravail"'
  );

  if (parseInt(count) > 0) {
    await sequelize.query('TRUNCATE TABLE "ContratTravail" CASCADE');
    console.log(`✅ ContratTravail — ${count} enregistrement(s) supprimé(s)`);
  }

  // Vérifie le type actuel de la colonne jour_travail
  const [cols] = await sequelize.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'ContratTravail'
      AND column_name = 'jour_travail'
  `);

  if (cols.length === 0) {
    console.log('ℹ️  ContratTravail — colonne jour_travail absente, sync va la créer');
    return;
  }

  const currentType = cols[0].data_type;

  if (currentType === 'json' || currentType === 'jsonb') {
    console.log('ℹ️  ContratTravail — jour_travail déjà en JSON, aucune migration nécessaire');
    return;
  }

  // Conversion TEXT → JSON avec USING (obligatoire sous PostgreSQL)
  await sequelize.query(`
    ALTER TABLE "ContratTravail"
    ALTER COLUMN "jour_travail" TYPE JSON
    USING jour_travail::json
  `);
  console.log(`✅ ContratTravail — colonne jour_travail convertie ${currentType.toUpperCase()} → JSON`);
}

module.exports = clearContratTravail;
