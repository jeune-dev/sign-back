'use strict';

const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

const checkActiveUser = (req, res, next) => {
  if (!req.user) return next(new UnauthorizedError('Utilisateur non authentifié'));
  if (req.user.statut !== 'actif') {
    return next(new ForbiddenError('Votre compte est désactivé. Veuillez contacter le support.'));
  }
  next();
};

module.exports = checkActiveUser;
