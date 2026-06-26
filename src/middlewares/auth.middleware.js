const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/security');
const User = require('../models/utilisateur.model');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const utilisateur = await User.findByPk(decoded.id);
    if (!utilisateur) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    // Un compte désactivé ne peut plus accéder à l'API même si son JWT est encore valide
    if (utilisateur.statut !== 'actif') {
      return res.status(403).json({ success: false, message: 'Compte désactivé. Contactez le support.' });
    }

    req.user = utilisateur;
    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    // Distinguer token expiré (→ tenter refresh) de token corrompu (→ forcer déconnexion)
    const message = err.name === 'TokenExpiredError' ? 'Token expiré' : 'Token invalide';
    return res.status(401).json({ success: false, message });
  }
};

module.exports = authMiddleware;
