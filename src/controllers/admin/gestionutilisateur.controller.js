const GestionUtilisateurService = require('../../services/admin/gestionutilisateur.service');
const logger = require('../../utils/logger');
const formatUser = require('../../utils/formatUser');

exports.listeUtilisateur = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.listerUtilisateurs({ page: req.query.page, limit: req.query.limit });
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { utilisateurs: result.utilisateurs.map(u => formatUser(u)), pagination: result.pagination }
    });
  } catch (error) {
    logger.error('Erreur dans listeUtilisateur :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

exports.nombreUtilisateur = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreUtilisateurs();
    return res.status(200).json({ success: true, message: result.message, data: { total: result.totalUtilisateurs } });
  } catch (error) {
    logger.error('Erreur dans nombreUtilisateur :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du comptage des utilisateurs' });
  }
};

exports.nombreParticuliers = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreParticuliers();
    return res.status(200).json({ success: true, message: result.message, data: { total: result.totalParticuliers } });
  } catch (error) {
    logger.error('Erreur dans nombreParticuliers :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du comptage des particuliers' });
  }
};

exports.nombreIndependants = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreIndependants();
    return res.status(200).json({ success: true, message: result.message, data: { total: result.totalIndependants } });
  } catch (error) {
    logger.error('Erreur dans nombreIndependants :', error);
    return res.status(500).json({ success: false, message: "Erreur lors du comptage des indépendants" });
  }
};

exports.nombreProfessionnels = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreProfessionnels();
    return res.status(200).json({ success: true, message: result.message, data: { total: result.totalProfessionnels } });
  } catch (error) {
    logger.error('Erreur lors du comptage des professionnels :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du comptage des professionnels' });
  }
};

exports.activerUtilisateur = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.activerUtilisateur(req.params.id);
    return res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
  } catch (error) {
    logger.error('Erreur dans activerUtilisateur :', error);
    return res.status(400).json({ success: false, message: error.message || "Impossible d'activer l'utilisateur" });
  }
};

exports.desactiverUtilisateur = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.desactiverUtilisateur(req.params.id);
    return res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
  } catch (error) {
    logger.error('Erreur dans desactiverUtilisateur :', error);
    return res.status(400).json({ success: false, message: error.message || "Impossible de désactiver l'utilisateur" });
  }
};

exports.supprimerUtilisateur = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.supprimerUtilisateur(req.params.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('Erreur dans supprimerUtilisateur :', error);
    return res.status(error.status || 400).json({ success: false, message: error.message || "Impossible de supprimer l'utilisateur" });
  }
};
