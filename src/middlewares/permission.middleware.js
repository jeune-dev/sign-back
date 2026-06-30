'use strict';

const { ForbiddenError } = require('../errors/AppError');

const requirePermission = (permission) => (req, res, next) => {
  const perms = req.user?.permissions;
  // Modèle strict : aucun accès implicite. L'accès total se donne explicitement
  // via ['all'] ; null / [] = compte restreint tant qu'aucune permission n'est accordée.
  if (!Array.isArray(perms) || perms.length === 0) {
    return next(new ForbiddenError('Accès refusé : aucune permission définie pour ce compte.'));
  }
  if (perms.includes('all') || perms.includes(permission)) return next();
  return next(new ForbiddenError("Vous n'avez pas la permission d'accéder à cette ressource."));
};

module.exports = requirePermission;
