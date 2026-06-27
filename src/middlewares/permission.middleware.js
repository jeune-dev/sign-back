'use strict';

const { ForbiddenError } = require('../errors/AppError');

const requirePermission = (permission) => (req, res, next) => {
  const perms = req.user?.permissions;
  if (!Array.isArray(perms) || perms.length === 0) {
    return next(new ForbiddenError('Accès refusé : aucune permission définie pour ce compte.'));
  }
  if (perms.includes('all') || perms.includes(permission)) return next();
  return next(new ForbiddenError("Vous n'avez pas la permission d'accéder à cette ressource."));
};

module.exports = requirePermission;
