/**
 * permission.middleware.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Vérifie qu'un administrateur possède une permission précise.
 * À utiliser APRÈS `adminMiddleware` (qui renseigne `req.user`).
 *
 * Règles :
 *   - Un admin sans permissions définies (null / tableau vide) = super-admin
 *     historique → accès total (rétro-compatibilité avec les comptes existants).
 *   - Un admin dont les permissions contiennent 'all' = accès total.
 *   - Sinon, la permission demandée doit figurer dans son tableau de permissions.
 *
 * Usage :
 *   router.get('/liste-utilisateur', adminMiddleware, requirePermission('users'), ctrl);
 */
const requirePermission = (permission) => (req, res, next) => {
  const perms = req.user?.permissions;

  // Pas de permissions définies → accès total (super-admin / compte historique)
  if (!Array.isArray(perms) || perms.length === 0) return next();

  if (perms.includes('all') || perms.includes(permission)) return next();

  return res.status(403).json({
    message: "Vous n'avez pas la permission d'accéder à cette ressource.",
  });
};

module.exports = requirePermission;
