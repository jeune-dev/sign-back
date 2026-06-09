const { fn, col, literal, Op } = require('sequelize');
const { Contrat, Document, ContratTravail } = require('../../models');

class DashboardProfessionnelService {

  static async getStats({ utilisateurConnecte }) {
    const id = utilisateurConnecte.id;

    const [
      nombreContratsImmobilier,
      nombreContratsTravail,
      nombreFactures,
      creancesResult,
    ] = await Promise.all([
      // ── Comptages ──────────────────────────────────────────────────────────
      Contrat.count({ where: { bailleurId: id } }),
      ContratTravail.count({ where: { employeurId: id } }),
      Document.count({ where: { professionnelId: id } }),

      // ── KPI Créances clients ───────────────────────────────────────────────
      // = somme de (montant - avance) pour toutes les factures où :
      //   • avance > 0   → un versement partiel a été effectué
      //   • avance < montant → la facture n'est pas entièrement soldée
      Document.findOne({
        attributes: [
          [fn('COALESCE', fn('SUM', literal('"montant" - "avance"')), 0), 'totalCreances'],
        ],
        where: {
          professionnelId: id,
          avance: { [Op.gt]: 0 },
          [Op.and]: literal('"avance" < "montant"'),
        },
        raw: true,
      }),
    ]);

    const creancesClients = parseFloat(creancesResult?.totalCreances) || 0;

    return {
      success: true,
      data: {
        nombreContratsImmobilier,
        nombreContratsTravail,
        nombreFactures,
        creancesClients,   // ← nouveau KPI
      },
    };
  }

}

module.exports = DashboardProfessionnelService;
