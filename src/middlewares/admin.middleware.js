const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/security');
const User = require('../models/utilisateur.model');

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const utilisateur = await User.findByPk(decoded.id);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (utilisateur.statut !== 'actif') {
      return res.status(403).json({ message: 'Votre compte est inactif. Accès refusé.' });
    }

    if (utilisateur.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès refusé. Réservé aux administrateurs.' });
    }

    req.user = utilisateur;
    next();
  } catch (err) {
    console.error('Erreur middleware admin:', err);
    return res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = adminMiddleware;
