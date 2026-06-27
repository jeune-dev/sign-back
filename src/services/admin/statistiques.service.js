const { Op } = require('sequelize');
const {
  Utilisateur,
  Document,
  Contrat,
  ContratTravail,
  ContratPrestation,
  ContratPartenariat,
  ContratLocation,
  ReconnaissanceDette,
  Procuration,
  ContratCaution,
  ContratConfidentialite,
} = require('../../models/index');

const GestionContratService = require('./gestionContrat.service');
const formatUser = require('../../utils/formatUser');

// Tous les modèles de contrats, avec leur code et libellé affichable côté dashboard
const CONTRAT_MODELS = [
  { code: 'bail',            label: 'Bail immobilier',         model: Contrat },
  { code: 'travail',         label: 'Contrat de travail',      model: ContratTravail },
  { code: 'prestation',      label: 'Prestation',              model: ContratPrestation },
  { code: 'partenariat',     label: 'Partenariat',             model: ContratPartenariat },
  { code: 'location',        label: 'Location',                model: ContratLocation },
  { code: 'dette',           label: 'Reconnaissance de dette', model: ReconnaissanceDette },
  { code: 'procuration',     label: 'Procuration',             model: Procuration },
  { code: 'caution',         label: 'Caution',                 model: ContratCaution },
  { code: 'confidentialite', label: 'Confidentialité',         model: ContratConfidentialite },
];

/* Génère la liste des n derniers mois (mois courant inclus).
   Retourne [{ key: '2026-01', label: 'janv.' }, ...] du plus ancien au plus récent. */
function derniersMois(n = 6) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    out.push({ key, label });
  }
  return out;
}

/* Clé "AAAA-MM" d'une date quelconque */
function moisKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* Répartit une liste d'éléments dans les buckets mensuels.
   getVal permet de sommer un montant plutôt que de compter (défaut : +1). */
function bucketParMois(items, moisList, getDate, getVal = () => 1) {
  const map = Object.fromEntries(moisList.map((m) => [m.key, 0]));
  for (const it of items) {
    const k = moisKey(getDate(it));
    if (k in map) map[k] += getVal(it);
  }
  return moisList.map((m) => ({ mois: m.label, valeur: map[m.key] }));
}

class StatistiquesService {

  // -------------------- STATISTIQUES GLOBALES DU DASHBOARD --------------------
  // Chaque section est isolée : si une requête échoue (ex. table/colonne
  // manquante, migration non passée), on renvoie des valeurs par défaut pour
  // cette section au lieu de faire échouer tout le tableau de bord.
  static async getStatistiques() {
    const moisList = derniersMois(6);
    const safe = async (fn, fallback) => {
      try { return await fn(); }
      catch (e) { console.error('[statistiques]', e.message); return fallback; }
    };

    // ════════════════════════════════════════════════════════════
    // UTILISATEURS
    // ════════════════════════════════════════════════════════════
    const utilisateurs = await safe(async () => {
      const [
        totalUsers, usersActifs, usersInactifs,
        nbParticuliers, nbIndependants, nbProfessionnels, nbAdmins,
        usersPourMois,
      ] = await Promise.all([
        Utilisateur.count({ where: { role: { [Op.ne]: 'Admin' } } }),
        Utilisateur.count({ where: { role: { [Op.ne]: 'Admin' }, statut: 'actif' } }),
        Utilisateur.count({ where: { role: { [Op.ne]: 'Admin' }, statut: 'inactif' } }),
        Utilisateur.count({ where: { role: 'Particulier' } }),
        Utilisateur.count({ where: { role: 'Independant' } }),
        Utilisateur.count({ where: { role: 'Professionnel' } }),
        Utilisateur.count({ where: { role: 'Admin' } }),
        Utilisateur.findAll({ attributes: ['createdAt'], where: { role: { [Op.ne]: 'Admin' } } }),
      ]);
      return {
        total: totalUsers, actifs: usersActifs, inactifs: usersInactifs,
        parRole: {
          Particulier: nbParticuliers, Independant: nbIndependants,
          Professionnel: nbProfessionnels, Admin: nbAdmins,
        },
        nouveauxParMois: bucketParMois(usersPourMois, moisList, (u) => u.createdAt),
      };
    }, { total: 0, actifs: 0, inactifs: 0, parRole: {}, nouveauxParMois: bucketParMois([], moisList, () => null) });

    // ════════════════════════════════════════════════════════════
    // CONTRATS (9 types agrégés)
    // ════════════════════════════════════════════════════════════
    const contrats = await safe(async () => {
      const countsParType = await Promise.allSettled(CONTRAT_MODELS.map((m) => m.model.count()));
      const parType = CONTRAT_MODELS.map((m, i) => ({
        code: m.code, label: m.label,
        valeur: countsParType[i].status === 'fulfilled' ? countsParType[i].value : 0,
      }));
      const totalContrats = parType.reduce((acc, t) => acc + t.valeur, 0);

      const lignesContratsRes = await Promise.allSettled(
        CONTRAT_MODELS.map((m) => m.model.findAll({ attributes: ['statut', 'createdAt'] }))
      );
      const lignesContrats = [];
      lignesContratsRes.forEach((r) => { if (r.status === 'fulfilled') lignesContrats.push(...r.value); });

      const parStatut = { signe: 0, en_attente: 0, autres: 0 };
      lignesContrats.forEach((c) => {
        if (c.statut === 'signe') parStatut.signe++;
        else if (c.statut === 'en_attente') parStatut.en_attente++;
        else parStatut.autres++;
      });

      return {
        total: totalContrats,
        parType: parType.sort((a, b) => b.valeur - a.valeur),
        parStatut,
        nouveauxParMois: bucketParMois(lignesContrats, moisList, (c) => c.createdAt),
      };
    }, { total: 0, parType: [], parStatut: { signe: 0, en_attente: 0, autres: 0 }, nouveauxParMois: bucketParMois([], moisList, () => null) });

    // ════════════════════════════════════════════════════════════
    // FACTURES — VOLUME UNIQUEMENT (montants = donnée client)
    // ════════════════════════════════════════════════════════════
    const factures = await safe(async () => {
      const lignes = await Document.findAll({ attributes: ['statut', 'createdAt'] });
      return {
        total: lignes.length,
        nouveauxParMois: bucketParMois(lignes, moisList, (f) => f.createdAt),
      };
    }, { total: 0, nouveauxParMois: bucketParMois([], moisList, () => null) });

    // Total de documents générés (contrats + factures)
    const documents = {
      total: contrats.total + factures.total,
      nouveauxParMois: moisList.map((m, i) => ({
        mois: m.label,
        valeur: (contrats.nouveauxParMois[i]?.valeur || 0) + (factures.nouveauxParMois[i]?.valeur || 0),
      })),
    };

    // ════════════════════════════════════════════════════════════
    // ACTIVITÉ RÉCENTE
    // ════════════════════════════════════════════════════════════
    const recentsContrats = await safe(
      async () => (await GestionContratService.listeContrats({ page: 1, limit: 5 }))?.contrats || [],
      []
    );
    const recentsFactures = await safe(
      async () => Document.findAll({
        include: [{ model: Utilisateur, as: 'client', attributes: ['id', 'nom', 'prenom', 'email'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      []
    );
    const recentsUsers = await safe(
      async () => {
        const rows = await Utilisateur.findAll({
          attributes: ['id', 'nom', 'prenom', 'email', 'role', 'statut', 'telephone', 'photoProfil', 'createdAt'],
          where: { role: { [Op.ne]: 'Admin' } },
          order: [['createdAt', 'DESC']],
          limit: 5,
        });
        return rows.map((u) => formatUser(u));
      },
      []
    );

    return {
      success: true,
      stats: {
        utilisateurs, contrats, factures, documents,
        recents: { contrats: recentsContrats, factures: recentsFactures, utilisateurs: recentsUsers },
      },
    };
  }
}

module.exports = StatistiquesService;
