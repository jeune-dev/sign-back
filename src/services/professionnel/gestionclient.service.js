const Utilisateur = require('../../models/utilisateur.model');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/db');
const { bcryptConfig } = require('../../config/security');
const { sendEmail } = require('../../utils/mailer');
const welcomeTemplate = require('../../templates/mail/welcome.template');
const { Op } = require('sequelize');


class GestionClientService {

  // -------------------- CREATION CLIENT PROFESSIONNEL / ENTREPRISE --------------------
  static async ajoutClient({
    nom,
    prenom,
    email,
    mot_de_passe,
    adresse,
    telephone,
    photoProfil,
    carte_identite_national_num,
    role = 'Client'
  }) {
    const t = await sequelize.transaction();
    try {
      const exist = await Utilisateur.findOne({ where: { email }, transaction: t });
      if (exist) {
        await t.rollback();
        return { error: 'Cet utilisateur existe déjà.' };
      }

      const hashedPassword = await bcrypt.hash(
        mot_de_passe,
        bcryptConfig.saltRounds
      );

      const utilisateur = await Utilisateur.create({
        nom,
        prenom,
        email,
        mot_de_passe: hashedPassword,
        adresse,
        telephone,
        photoProfil,
        carte_identite_national_num,
        role
      }, { transaction: t });

      await t.commit();

      // Envoi email (non bloquant)
      try {
        const html = welcomeTemplate({ nom: utilisateur.nom, prenom: utilisateur.prenom });
        await sendEmail({
          to: utilisateur.email,
          subject: "Bienvenue sur Sign !",
          html
        });
      } catch (mailError) {
        console.error("Erreur envoi email bienvenue:", mailError);
      }

      return { utilisateur };

    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  
  // -------------------- MODIFICATION CLIENT CLIENT PROFESSIONNEL / ENTREPRISE --------------------
   static async modificationClient({ userId, data }) {
    const {
        nom,
        prenom,
        email,
        telephone,
        adresse,
        photoProfil,
        carte_identite_national_num
    } = data;

    const t = await sequelize.transaction();

    try {
        const utilisateur = await Utilisateur.findByPk(userId, { transaction: t });
        if (!utilisateur) {
        await t.rollback();
        return { error: "Utilisateur non trouvé" };
        }

        // Vérification email
        if (email && email !== utilisateur.email) {
        const existEmail = await Utilisateur.findOne({
            where: { email },
            transaction: t
        });
        if (existEmail) {
            await t.rollback();
            return { error: "Cet email est déjà utilisé" };
        }
        utilisateur.email = email;
        }

        // Vérification téléphone
        if (telephone && telephone !== utilisateur.telephone) {
        const existTel = await Utilisateur.findOne({
            where: { telephone },
            transaction: t
        });
        if (existTel) {
            await t.rollback();
            return { error: "Ce numéro de téléphone est déjà utilisé" };
        }
        utilisateur.telephone = telephone;
        }

        // Vérification CIN
        if (
        carte_identite_national_num &&
        carte_identite_national_num !== utilisateur.carte_identite_national_num
        ) {
        const existCIN = await Utilisateur.findOne({
            where: { carte_identite_national_num },
            transaction: t
        });
        if (existCIN) {
            await t.rollback();
            return { error: "Le numéro CIN est déjà utilisé" };
        }
        utilisateur.carte_identite_national_num = carte_identite_national_num;
        }

        if (nom) utilisateur.nom = nom;
        if (prenom) utilisateur.prenom = prenom;
        if (adresse !== undefined) utilisateur.adresse = adresse;
        if (photoProfil) utilisateur.photoProfil = photoProfil;

        await utilisateur.save({ transaction: t });
        await t.commit();

        return {
        message: "Profil modifié avec succès",
        utilisateur
        };

    } catch (error) {
        await t.rollback();
        throw error;
    }
}

// -------------------- RECHERCHE CLIENT --------------------
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
      return { error: "Veuillez fournir au moins un critère de recherche" };
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
      return { message: "Aucun client particulier trouvé" };
    }

    return {
      message: "Client(s) particulier trouvé(s)",
      utilisateurs
    };

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
      return { error: 'Veuillez fournir au moins un critère de recherche' };
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
      return { found: false, message: 'Profil introuvable, demander une création de compte à l\'autre partie' };
    }

    return { found: true, message: 'Utilisateur(s) trouvé(s)', utilisateurs };

  } catch (error) {
    throw error;
  }
}

// -------------------- LISTE DES CLIENTS (PAGINATION) --------------------
static async listerClients({ page = 1, limit = 10 }) {
  try {
    const currentPage = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    const offset = (currentPage - 1) * pageSize;

    const { count, rows } = await Utilisateur.findAndCountAll({
      where: {
        role: 'Particulier',
        statut: 'actif'
      },
      attributes: { exclude: ['mot_de_passe'] },
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / pageSize);

    return {
      message: "Liste des clients",
      pagination: {
        totalClients: count,
        totalPages,
        currentPage,
        pageSize
      },
      utilisateurs: rows
    };

  } catch (error) {
    throw error;
  }
}

}

module.exports = GestionClientService;
