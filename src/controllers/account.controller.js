const AccountService = require('../services/account.service');
const { saveDeviceToken } = require('../services/notification.service');
const formatUser = require('../utils/formatUser');
const logger = require('../utils/logger');

exports.me = async (req, res) => {
  try {
    const result = await AccountService.getMe(req.user.id);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    return res.status(200).json({ utilisateur: formatUser(result.utilisateur) });
  } catch (err) {
    logger.error('Erreur me:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.modifierInfoPersonnelles = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await AccountService.modifierInfoPersonnelles(userId, req.body, req.files || {});

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.status(200).json({
      message: result.message,
      utilisateur: formatUser(result.utilisateur)
    });
  } catch (err) {
    logger.error('Erreur modification profil:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.saveDeviceToken = async (req, res) => {
  const { token, platform } = req.body;
  if (!token) return res.status(400).json({ message: 'Token requis' });
  try {
    await saveDeviceToken(req.user.id, token, platform || 'android');
    return res.status(200).json({ message: 'Token enregistré' });
  } catch (err) {
    logger.error('Erreur saveDeviceToken:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "L'email est obligatoire"
    });
  }

  try {
    const result = await AccountService.forgotPassword(email);

    if (result.error) {
      return res.status(404).json({
        message: result.error
      });
    }

    return res.status(200).json({
      message: result.message
    });

  } catch (error) {
    logger.error('Erreur controller forgotPassword:', error);
    return res.status(500).json({
      message: "Erreur serveur lors de la demande de réinitialisation",
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otpRecu, newPassword } = req.body;
  try {
    const result = await AccountService.resetPassword(email, otpRecu, newPassword);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    return res.status(200).json({ message: result.message });
  } catch (error) {
    logger.error('Erreur controller resetPassword:', error);
    return res.status(500).json({ message: "Erreur serveur lors de la réinitialisation du mot de passe" });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;

  const { oldPassword, newPassword } = req.body;

  // Vérification des champs
  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      message: "L'ancien et le nouveau mot de passe sont obligatoires"
    });
  }

  try {
    const result = await AccountService.changePassword(
      userId,
      oldPassword,
      newPassword
    );

    if (result.error) {
      return res.status(400).json({
        message: result.error
      });
    }

    return res.status(200).json({
      message: result.message
    });

  } catch (error) {
    logger.error("Erreur controller changePassword:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du changement de mot de passe",
    });
  }
};

// -------------------- ACTIVATION/DESACTIVATION COMPTE --------------------

exports.deactivateAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await AccountService.deactivateUser(userId);

    if (result.error) {
      return res.status(400).json({
        message: result.error
      });
    }

    return res.status(200).json({
      message: result.message,
      utilisateur: result.utilisateur
    });

  } catch (error) {
    logger.error("Erreur controller deactivateAccount:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la désactivation du compte",
    });
  }
};

exports.activateAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await AccountService.activateUser(userId);

    if (result.error) {
      return res.status(400).json({
        message: result.error
      });
    }

    return res.status(200).json({
      message: result.message,
      utilisateur: result.utilisateur
    });

  } catch (error) {
    logger.error("Erreur controller activateAccount:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de l'activation du compte",
    });
  }
};

exports.toggleAccountStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await AccountService.toggleUserStatus(userId);

    if (result.error) {
      return res.status(400).json({
        message: result.error
      });
    }

    return res.status(200).json({
      message: result.message,
      utilisateur: result.utilisateur
    });

  } catch (error) {
    logger.error("Erreur controller toggleAccountStatus:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du changement du statut du compte",
    });
  }
};

// ──────────────────────────── RGPD ───────────────────────────────────────

exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await AccountService.deleteAccount(userId);
    if (result.error) return res.status(400).json({ message: result.error });
    return res.status(200).json({ message: result.message });
  } catch (error) {
    logger.error("Erreur controller deleteAccount:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la suppression du compte" });
  }
};

exports.exportData = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await AccountService.exportData(userId);
    if (result.error) return res.status(404).json({ message: result.error });
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur controller exportData:", error);
    return res.status(500).json({ message: "Erreur serveur lors de l'export des données" });
  }
};

