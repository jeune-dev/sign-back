'use strict';
const GestionClientService = require('../../services/professionnel/gestionclient.service');
const asyncHandler = require('../../middlewares/asyncHandler');
const { BadRequestError } = require('../../errors/AppError');
exports.rechercherClient = asyncHandler(async (req, res) => {
  const { carte_identite_national_num, telephone, nom, prenom, email } = req.query;
  const result = await GestionClientService.rechercherClient({ carte_identite_national_num, telephone, nom, prenom, email });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: result.message, data: { utilisateurs: result.data.utilisateurs } });
});
exports.rechercherAutrePartie = asyncHandler(async (req, res) => {
  const { rc, carte_identite_national_num, telephone, nom, email } = req.query;
  const result = await GestionClientService.rechercherAutrePartie({ rc, carte_identite_national_num, telephone, nom, email });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: result.message, data: { utilisateurs: result.data.utilisateurs } });
});
exports.listerClients = asyncHandler(async (req, res) => {
  const result = await GestionClientService.listerClients({ page: req.query.page || 1, limit: req.query.limit || 10, professionnelId: req.user.id });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: result.message, data: { utilisateurs: result.data.utilisateurs, pagination: result.data.pagination } });
});
