const GestionUtilisateurService = require('../../services/admin/gestionutilisateur.service');
const logger = require('../../utils/logger');
const formatUser = require('../../utils/formatUser');

// -------------------- LISTE DES UTILISATEURS --------------------
exports.listeUtilisateur = async (req, res) => {
  try {
    // On récupère tous les utilisateurs (plus besoin de page/limit)
    const result = await GestionUtilisateurService.listerUtilisateurs({ page: req.query.page, limit: req.query.limit });

    return res.status(200).json({
      message: result.message,
      utilisateurs: result.utilisateurs.map(user => formatUser(user)),
      pagination: result.pagination
    });

  } catch (error) {
    logger.error("Erreur dans listeUtilisateur :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors de la récupération des utilisateurs"
    });
  }
};

// -------------------- NOMBRE D'UTILISATEURS --------------------
exports.nombreUtilisateur = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreUtilisateurs();
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur dans nombreUtilisateur :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des utilisateurs"
    });
  }
};

// -------------------- NOMBRE DE PARTICULIERS --------------------
exports.nombreParticuliers = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreParticuliers();
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur dans nombreParticuliers :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des particuliers"
    });
  }
};

// -------------------- NOMBRE D'INDEPENDANTS --------------------
exports.nombreIndependants = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreIndependants();
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur dans nombreIndependants :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des indépendants"
    });
  }
};

// -------------------- NOMBRE DE PROFESSIONNELS --------------------
exports.nombreProfessionnels = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreProfessionnels();
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur lors du comptage des professionnels :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des professionnels"
    });
  }
};

// -------------------- ACTIVER UTILISATEUR --------------------
exports.activerUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await GestionUtilisateurService.activerUtilisateur(id);

    return res.status(200).json(result);

  } catch (error) {
    logger.error("Erreur dans activerUtilisateur :", error);

    return res.status(400).json({
      message: "Impossible d'activer l'utilisateur"
    });
  }
};

// -------------------- SUPPRIMER UTILISATEUR (RGPD) --------------------
exports.supprimerUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GestionUtilisateurService.supprimerUtilisateur(id);
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur dans supprimerUtilisateur :", error);
    return res.status(error.status || 400).json({
      message: error.message || "Impossible de supprimer l'utilisateur"
    });
  }
};

// -------------------- DESACTIVER UTILISATEUR --------------------
exports.desactiverUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await GestionUtilisateurService.desactiverUtilisateur(id);

    return res.status(200).json(result);

  } catch (error) {
    logger.error("Erreur dans desactiverUtilisateur :", error);

    return res.status(400).json({
      message: "Impossible de désactiver l'utilisateur"
    });
  }
};