'use strict';

const { Op } = require('sequelize');
const { Document, Utilisateur, DocumentItem } = require('../../models');
const paginate = require('../../utils/paginate');

class ParticulierFacturesService {

  // ============================================================
  // LISTE DES FACTURES DU PARTICULIER
  // Statut : 'signe'     → document_pdf IS NOT NULL
  //          'en_attente' → document_pdf IS NULL
  //          (absent)    → toutes
  // ============================================================
  static async getFactures({ userId, statut, page = 1, limit = 20 }) {
    const { offset } = paginate(page, limit);

    const whereClause = { clientId: userId };
    if (statut === 'signe') {
      whereClause.document_pdf = { [Op.ne]: null };
    } else if (statut === 'en_attente') {
      whereClause.document_pdf = null;
    }

    const { rows, count } = await Document.findAndCountAll({
      where: whereClause,
      include: [
        {
          model:      Utilisateur,
          as:         'professionnel',
          attributes: ['id', 'prenom', 'nom', 'email', 'nom_entreprise', 'telephone'],
        },
        {
          model: DocumentItem,
          as:    'items',
        },
      ],
      order:  [['createdAt', 'DESC']],
      limit,
      offset,
      // Exclure le gros base64 de la liste pour alléger la réponse
      attributes: { exclude: ['document_pdf'] },
    });

    return {
      factures: rows,
      total:    count,
      page,
      pages:    Math.ceil(count / limit),
    };
  }

  // ============================================================
  // DÉTAIL D'UNE FACTURE (avec PDF)
  // ============================================================
  static async getFactureDetail({ userId, factureId }) {
    const facture = await Document.findOne({
      where:   { id: factureId, clientId: userId },
      include: [
        {
          model:      Utilisateur,
          as:         'professionnel',
          attributes: ['id', 'prenom', 'nom', 'email', 'nom_entreprise', 'telephone', 'adresse'],
        },
        {
          model: DocumentItem,
          as:    'items',
        },
      ],
    });

    if (!facture) return null;
    return facture;
  }
}

module.exports = ParticulierFacturesService;
