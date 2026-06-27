const Utilisateur = require('../../models/utilisateur.model');
const { Op } = require('sequelize');
const paginate = require('../../utils/paginate');

class GestionUtilisateurService {

  static async listerUtilisateurs({ page, limit } = {}) {
    const { page: p, limit: l, offset } = paginate(page, limit);

    const { count, rows } = await Utilisateur.findAndCountAll({
      attributes: { exclude: ['mot_de_passe'] },
      where: { role: { [Op.ne]: 'Admin' } },
      order: [['createdAt', 'DESC']],
      limit: l,
      offset
    });

    return {
      message: "Liste des utilisateurs",
      utilisateurs: rows,
      pagination: { total: count, totalPages: Math.ceil(count / l), page: p, limit: l }
    };
  }

  static async nombreUtilisateurs() {
    const total = await Utilisateur.count({
      where: { role: { [Op.ne]: 'Admin' } }
    });

    return {
      message: "Nombre total d'utilisateurs",
      totalUtilisateurs: total
    };
  }

  static async nombreParticuliers() {
    const total = await Utilisateur.count({
      where: { role: 'Particulier' }
    });

    return { 
      message: "Nombre total particulier",
      totalParticuliers: total 
    };
  }

  static async nombreIndependants() {
    const total = await Utilisateur.count({
      where: { role: 'Independant' }
    });

    return {
      message: "Nombre total d'independant",
      totalIndependants: total 
    };
  }

  static async nombreProfessionnels() {
    const total = await Utilisateur.count({
      where: { role: 'Professionnel' }
    });

    return {
      message: "Nombre total de professionnel",
      totalProfessionnels: total 
    };
  }

  static async activerUtilisateur(id) {
  try {

    const utilisateur = await Utilisateur.findByPk(id);

    if (!utilisateur) {
      throw new Error("Utilisateur introuvable");
    }

     await utilisateur.update({ statut: "actif" });

    return {
      message: "Utilisateur activé avec succès",
      utilisateur
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
}

static async supprimerUtilisateur(id) {
  const utilisateur = await Utilisateur.findByPk(id);
  if (!utilisateur) {
    const err = new Error("Utilisateur introuvable");
    err.status = 404;
    throw err;
  }
  if (utilisateur.role === 'Admin') {
    const err = new Error("La suppression d'un administrateur se fait depuis la gestion des admins");
    err.status = 400;
    throw err;
  }
  // Suppression douce (le modèle est paranoid → deleted_at renseigné)
  await utilisateur.destroy();
  return { message: "Utilisateur supprimé avec succès" };
}

static async desactiverUtilisateur(id) {
  try {

    const utilisateur = await Utilisateur.findByPk(id);

    if (!utilisateur) {
      throw new Error("Utilisateur introuvable");
    }

    await utilisateur.update({ statut: "inactif" });

    return {
      message: "Utilisateur désactivé avec succès",
      utilisateur
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
}

}

module.exports = GestionUtilisateurService;