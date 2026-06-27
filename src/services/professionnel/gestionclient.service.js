const Utilisateur = require('../../models/utilisateur.model');
const { Document } = require('../../models/index');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/db');
const { bcryptConfig } = require('../../config/security');
const { sendWelcomeEmail } = require('../resend.service');
const { Op } = require('sequelize');


class GestionClientService {

  // -------------------- RECHERCHE CLIENT --------------------
  static async rechercherClient({
    carte_identite_national_num = null,
    telephone = null,
    nom = null,
    prenom = null,
    email = null
  }) {
    try {
      // Si aucun critère fourni, on renvoie une erreur
      if (!carte_identite_national_num &&
          !telephone &&
          !nom &&
          !prenom &&
          !email) {
        return { success: false, message: "Veuillez fournir au moins un critère de recherche" };
      }

      // Construire la recherche avec OR pour tous les champs fournis
      const conditions = [];

      if (carte_identite_national_num) {
        conditions.push({ carte_identite_national_num });
      }

      if (telephone) {
        conditions.push({ telephone });
      }

      if (nom) {
        conditions.push({ nom: { [Op.iLike]: `%${nom}%` } });
      }

      if (prenom) {
        conditions.push({ prenom: { [Op.iLike]: `%${prenom}%` } });
      }

      if (email) {
        conditions.push({ email: { [Op.iLike]: `%${email}%` } });
      }

      // Recherche avec role = Particulier + OR sur tous les critères
      const utilisateurs = await Utilisateur.findAll({
      where: {
          role: 'Particulier',
          statut: 'actif',      
          [Op.or]: conditions
        },
        attributes: { exclude: ['mot_de_passe'] }
      });

      if (!utilisateurs.length) {
        return { success: true, message: "Aucun client particulier trouvé", data: { utilisateurs: [] } };
      }

      return { success: true, message: "Client(s) particulier trouvé(s)", data: { utilisateurs } };

    } catch (error) {
      throw error;
    }
  }

  // -------------------- RECHERCHE AUTRE PARTIE (TOUS RÔLES + RCCM) --------------------
  static async rechercherAutrePartie({
    rc = null,
    carte_identite_national_num = null,
    telephone = null,
    nom = null,
    email = null
  }) {
    try {
      if (!rc && !carte_identite_national_num && !telephone && !nom && !email) {
        return { success: false, message: 'Veuillez fournir au moins un critère de recherche' };
      }

      const conditions = [];
      if (rc) conditions.push({ rc: { [Op.iLike]: `%${rc}%` } });
      if (carte_identite_national_num) conditions.push({ carte_identite_national_num });
      if (telephone) conditions.push({ telephone });
      if (nom) conditions.push({ nom: { [Op.iLike]: `%${nom}%` } });
      if (email) conditions.push({ email: { [Op.iLike]: `%${email}%` } });

      const utilisateurs = await Utilisateur.findAll({
        where: {
          statut: 'actif',
          [Op.or]: conditions
        },
        attributes: { exclude: ['mot_de_passe'] }
      });

      if (!utilisateurs.length) {
        return { success: true, message: "Profil introuvable, demander une création de compte à l'autre partie", data: { utilisateurs: [] } };
      }

      return { success: true, message: 'Utilisateur(s) trouvé(s)', data: { utilisateurs } };

    } catch (error) {
      throw error;
    }
  }

  // -------------------- LISTE DES CLIENTS (PAGINATION) --------------------
  static async listerClients({ page = 1, limit = 20, professionnelId }) {
    try {
      const currentPage = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      const offset = (currentPage - 1) * pageSize;

      // Récupérer les IDs des clients liés à ce professionnel via les documents
      const documents = await Document.findAll({
        where: { professionnelId },
        attributes: ['clientId'],
        group: ['clientId']
      });

      const clientIds = documents.map(d => d.clientId);

      if (!clientIds.length) {
        return { success: true, message: "Liste des clients", data: { utilisateurs: [], pagination: { totalClients: 0, totalPages: 0, currentPage, pageSize } } };
      }

      const { count, rows } = await Utilisateur.findAndCountAll({
        where: { id: { [Op.in]: clientIds }, statut: 'actif' },
        attributes: { exclude: ['mot_de_passe'] },
        limit: pageSize,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / pageSize);

      return {
        success: true,
        message: "Liste des clients",
        data: { utilisateurs: rows, pagination: { totalClients: count, totalPages, currentPage, pageSize } }
      };

    } catch (error) {
      throw error;
    }
  }

}

module.exports = GestionClientService;
