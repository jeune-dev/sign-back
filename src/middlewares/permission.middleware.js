/**
 * permission.middleware.js
 * Vérifie qu'un administrateur possède une permission précise.
 * À utiliser APRÈS  (qui renseigne ).
 *
 * Règles :
 *   - Un admin dont les permissions contiennent 'all' = accès total.
 *   - Sinon, la permission demandée doit figurer dans son tableau de permissions.
 *   - Aucune permission définie (null / vide) = ACCÈS REFUSÉ (fail-closed, OWASP A01).
 *
 * Usage :
 *   router.get('/liste-utilisateur', adminMiddleware, requirePermission('users'), ctrl);
 */
const requirePermission = (permission) => (req, res, next) => {
  const perms = req.user?.permissions;

  // Fail-closed : sans permissions explicites → accès refusé
  // Les admins légitimes ont permissions: ['all'] ou une liste explicite définie
  if (!Array.isArray(perms) || perms.length === 0) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé : aucune permission définie pour ce compte.',
    });
  }

  if (perms.includes('all') || perms.includes(permission)) return next();

  return res.status(403).json({
    success: false,
    message: "Vous n'avez pas la permission d'accéder à cette ressource.",
  });
};

module.exports = requirePermission;
