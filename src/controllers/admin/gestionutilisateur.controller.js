'use strict';
const GestionUtilisateurService = require('../../services/admin/gestionutilisateur.service');
const formatUser = require('../../utils/formatUser');
const asyncHandler = require('../../middlewares/asyncHandler');
exports.listeUtilisateur = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.listerUtilisateurs({ page: req.query.page, limit: req.query.limit });
  res.status(200).json({ success: true, message: result.message, data: { utilisateurs: result.utilisateurs.map(function(u){ return formatUser(u); }), pagination: result.pagination } });
});
exports.nombreUtilisateur = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.nombreUtilisateurs();
  res.status(200).json({ success: true, message: result.message, data: { total: result.totalUtilisateurs } });
});
exports.nombreParticuliers = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.nombreParticuliers();
  res.status(200).json({ success: true, message: result.message, data: { total: result.totalParticuliers } });
});
exports.nombreIndependants = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.nombreIndependants();
  res.status(200).json({ success: true, message: result.message, data: { total: result.totalIndependants } });
});
exports.nombreProfessionnels = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.nombreProfessionnels();
  res.status(200).json({ success: true, message: result.message, data: { total: result.totalProfessionnels } });
});
exports.activerUtilisateur = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.activerUtilisateur(req.params.id);
  res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
});
exports.desactiverUtilisateur = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.desactiverUtilisateur(req.params.id);
  res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
});
exports.supprimerUtilisateur = asyncHandler(async (req, res) => {
  const result = await GestionUtilisateurService.supprimerUtilisateur(req.params.id);
  res.status(200).json({ success: true, message: result.message });
});
