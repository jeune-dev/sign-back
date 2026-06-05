const Facture = require('../../models/document.model');
const paginate = require('../../utils/paginate');
const DocumentItem = require('../../models/documentItem.model');
const Utilisateur = require('../../models/utilisateur.model');

class GestionFactureService {

  // -------------------- NOMBRE TOTAL DE FACTURES --------------------
  static async nombreTotalFactures() {
    try {
      const total = await Facture.count();

      return {
        message: "Nombre total de factures générées",
        totalFactures: total
      };
    } catch (error) {
      console.error("Erreur lors du comptage des factures :", error);
      throw error;
    }
  }


  // -------------------- CONSULTER UNE FACTURE PAR ID --------------------
  static async consulterFacture(id) {
    try {
      const facture = await Facture.findByPk(id);

      if (!facture) {
        throw new Error("Facture introuvable");
      }

      return {
        message: "Facture trouvée avec succès",
        facture
      };

    } catch (error) {
      console.error("Erreur lors de la consultation de la facture :", error);
      throw error;
    }
  }

  static async listeFacture({ page, limit } = {}) {
    const { page: p, limit: l, offset } = paginate(page, limit);

    const { count, rows } = await Facture.findAndCountAll({
      include: [
        { model: Utilisateur, as: 'client',        attributes: ['id', 'nom', 'prenom', 'email'] },
        { model: Utilisateur, as: 'professionnel', attributes: ['id', 'nom', 'prenom', 'email'] },
        { model: DocumentItem, as: 'items' }
      ],
      order: [['createdAt', 'DESC']],
      limit: l,
      offset,
      distinct: true
    });

    return {
      success: true,
      factures: rows,
      pagination: { total: count, totalPages: Math.ceil(count / l), page: p, limit: l }
    };
  }
}

module.exports = GestionFactureService;