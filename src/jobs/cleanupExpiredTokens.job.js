const cron = require('node-cron');
const { Op } = require('sequelize');
const { RefreshToken, UserOtp } = require('../models/index');
const logger = require('../utils/logger');

/**
 * Supprime les RefreshToken expirés/révoqués et les UserOtp expirés.
 * Ces deux tables grossissent à chaque login / demande OTP sans purge — elles
 * n'ont aucune autre mécanique de nettoyage dans le code.
 */
async function cleanupExpiredTokens() {
  try {
    const now = new Date();

    const deletedRefreshTokens = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.lt]: now } },
          { revoked: true },
        ],
      },
    });

    const deletedOtps = await UserOtp.destroy({
      where: { expiresAt: { [Op.lt]: now } },
    });

    logger.info('Nettoyage tokens expirés', {
      refreshTokensSupprimés: deletedRefreshTokens,
      otpsSupprimés: deletedOtps,
    });
  } catch (err) {
    logger.error('Échec nettoyage tokens expirés', { error: err.message, stack: err.stack });
  }
}

/** Démarre le job — chaque lundi à 00h00. */
function startCleanupExpiredTokensJob() {
  cron.schedule('0 0 * * 1', cleanupExpiredTokens);
  logger.info('Job de nettoyage tokens expirés planifié (chaque lundi 00h00)');
}

module.exports = { startCleanupExpiredTokensJob, cleanupExpiredTokens };
