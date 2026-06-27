const AccountService = require('../services/account.service');
const { saveDeviceToken } = require('../services/notification.service');
const formatUser = require('../utils/formatUser');
const logger = require('../utils/logger');

exports.me = async (req, res) => {
  try {
    const result = await AccountService.getMe(req.user.id);
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }
    return res.status(200).json({
      success: true,
      message: 'Profil récupéré',
      data: { utilisateur: formatUser(result.utilisateur) }
    });
  } catch (err) {
    logger.error('Erreur me:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.modifierInfoPersonnelles = async (req, res) => {
  try {
    const result = await AccountService.modifierInfoPersonnelles(req.user.id, req.body, req.files || {});
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { utilisateur: formatUser(result.utilisateur) }
    });
  } catch (err) {
    logger.error('Erreur modification profil:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.saveDeviceToken = async (req, res) => {
  const { token, platform } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Token requis' });
  try {
    await saveDeviceToken(req.user.id, token, platform || 'android');
    return res.status(200).json({ success: true, message: 'Token enregistré' });
  } catch (err) {
    logger.error('Erreur saveDeviceToken:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "L'email est obligatoire" });
  try {
    const result = await AccountService.forgotPassword(email);
    if (result.error) return res.status(404).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('Erreur controller forgotPassword:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la demande de réinitialisation' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otpRecu, newPassword } = req.body;
  try {
    const result = await AccountService.resetPassword(email, otpRecu, newPassword);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('Erreur controller resetPassword:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la réinitialisation du mot de passe' });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "L'ancien et le nouveau mot de passe sont obligatoires" });
  }
  try {
    const result = await AccountService.changePassword(req.user.id, oldPassword, newPassword);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('Erreur controller changePassword:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors du changement de mot de passe' });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const result = await AccountService.deactivateUser(req.user.id);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
  } catch (error) {
    logger.error('Erreur controller deactivateAccount:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la désactivation du compte' });
  }
};

exports.activateAccount = async (req, res) => {
  try {
    const result = await AccountService.activateUser(req.user.id);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
  } catch (error) {
    logger.error('Erreur controller activateAccount:', error);
    return res.status(500).json({ success: false, message: "Erreur serveur lors de l'activation du compte" });
  }
};

exports.toggleAccountStatus = async (req, res) => {
  try {
    const result = await AccountService.toggleUserStatus(req.user.id);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: result.message, data: { utilisateur: result.utilisateur } });
  } catch (error) {
    logger.error('Erreur controller toggleAccountStatus:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors du changement du statut du compte' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const result = await AccountService.deleteAccount(req.user.id);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('Erreur controller deleteAccount:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression du compte' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const result = await AccountService.exportData(req.user.id);
    if (result.error) return res.status(404).json({ success: false, message: result.error });
    return res.status(200).json({ success: true, message: 'Données exportées avec succès', data: result });
  } catch (error) {
    logger.error('Erreur controller exportData:', error);
    return res.status(500).json({ success: false, message: "Erreur serveur lors de l'export des données" });
  }
};
