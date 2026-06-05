const { Contrat, Document, ContratTravail } = require('../../models');

class DashboardProfessionnelService {

  static async getStats({ utilisateurConnecte }) {
    const id = utilisateurConnecte.id;

    const [nombreContratsImmobilier, nombreContratsTravail, nombreFactures] = await Promise.all([
      Contrat.count({ where: { bailleurId: id } }),
      ContratTravail.count({ where: { employeurId: id } }),
      Document.count({ where: { professionnelId: id } })
    ]);

    return {
      success: true,
      data: { nombreContratsImmobilier, nombreContratsTravail, nombreFactures }
    };
  }

}

module.exports = DashboardProfessionnelService;
