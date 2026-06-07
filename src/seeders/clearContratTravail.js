const ContratTravail = require('../models/contratTravail.model');

async function clearContratTravail() {
  const count = await ContratTravail.count();

  if (count === 0) {
    console.log('ℹ️  ContratTravail — table vide, aucune action effectuée');
    return;
  }

  await ContratTravail.destroy({ where: {}, truncate: true });
  console.log(`✅ ContratTravail — ${count} enregistrement(s) supprimé(s) avant migration`);
}

module.exports = clearContratTravail;
