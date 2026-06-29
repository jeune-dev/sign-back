'use strict';

const AccountService = require('../services/account.service');
const { saveDeviceToken } = require('../services/notification.service');
const formatUser = require('../utils/formatUser');
const asyncHandler = require('../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

exports.me = asyncHandler(async (req, res) => {
  const result = await AccountService.getMe(req.user.id);
  if (!result.success) throw new NotFoundError(result.message);
  res.status(200).json({ success: true, message: 'Profil récupéré', data: { utilisateur: formatUser(result.utilisateur) } });
});

exports.modifierInfoPersonnelles = asyncHandler(async (req, res) => {
  const result = await AccountService.modifierInfoPersonnelles(req.user.id, req.body, req.files || {});
  if (!result.success) throw new BadRequestError(result.message);
  res.status(200).json({ success: true, message: result.message, data: { utilisateur: formatUser(result.utilisateur) } });
});

exports.saveDeviceToken = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  if (!token) throw new BadRequestError('Token requis');
  await saveDeviceToken(req.user.id, token, platform || 'android');
  res.status(200).json({ success: true, message: 'Token enregistré' });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await AccountService.forgotPassword(email);
  if (result.error) throw new NotFoundError(result.error);
  res.status(200).json({ success: true, message: result.message });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otpRecu, newPassword } = req.body;
  const result = await AccountService.resetPassword(email, otpRecu, newPassword);
  if (result.error) throw new BadRequestError(result.error);
  res.status(200).json({ success: true, message: result.message });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = await AccountService.changePassword(req.user.id, oldPassword, newPassword);
  if (result.error) throw new BadRequestError(result.error);
  res.status(200).json({ success: true, message: result.message });
});

exports.deactivateAccount = asyncHandler(async (req, res) => {
  const result = await AccountService.deactivateUser(req.user.id);
  if (result.error) throw new BadRequestError(result.error);
  res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
});

exports.activateAccount = asyncHandler(async (req, res) => {
  const result = await AccountService.activateUser(req.user.id);
  if (result.error) throw new BadRequestError(result.error);
  res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
});

exports.toggleAccountStatus = asyncHandler(async (req, res) => {
  const result = await AccountService.toggleUserStatus(req.user.id);
  if (result.error) throw new BadRequestError(result.error);
  res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const result = await AccountService.deleteAccount(req.user.id);
  if (result.error) throw new BadRequestError(result.error);
  res.status(200).json({ success: true, message: result.message });
});

exports.exportData = asyncHandler(async (req, res) => {
  const result = await AccountService.exportData(req.user.id);
  if (result.error) throw new NotFoundError(result.error);
  res.status(200).json({ success: true, message: 'Données exportées avec succès', data: result });
});
