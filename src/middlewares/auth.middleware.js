'use strict';

const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/security');
const User = require('../models/utilisateur.model');
const { UnauthorizedError, ForbiddenError, NotFoundError } = require('../errors/AppError');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Token manquant ou invalide'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const utilisateur = await User.findByPk(decoded.id);
    if (!utilisateur) return next(new NotFoundError('Utilisateur introuvable'));

    if (utilisateur.statut !== 'actif') {
      return next(new ForbiddenError('Compte désactivé. Contactez le support.'));
    }

    req.user = utilisateur;
    next();
  } catch (err) {
    // TokenExpiredError / JsonWebTokenError → errorHandler
    next(err);
  }
};

module.exports = authMiddleware;
