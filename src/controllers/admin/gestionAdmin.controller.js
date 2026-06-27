const GestionAdminService = require('../../services/admin/gestionAdmin.service');
const logger = require('../../utils/logger');
const formatAdmin = require('../../utils/formatAdmin');


// -------------------- LISTE DES ADMIN --------------------
exports.listeAdmin = async (req, res) => {
  try {
    // On récupère tous les admin (plus besoin de page/limit)
    const result = await GestionAdminService.listerAdmins({ page: req.query.page, limit: req.query.limit });

    return res.status(200).json({
      message: result.message,
      admins: result.admins.map(user => formatAdmin(user)),
      pagination: result.pagination
    });

  } catch (error) {
    logger.error("Erreur dans listeAdmin :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors de la récupération des admins"
    });
  }
};

// -------------------- CREATION DES ADMIN --------------------


exports.ajoutAdmin = async (req, res) => {
  const {
    nom,
    prenom,
    email,
    mot_de_passe,
    adresse,
    telephone,
    carte_identite_national_num,
    role
  } = req.body;

  const photoProfil = req.file || null;

  // Les permissions arrivent soit en tableau, soit en chaîne JSON (formulaire multipart).
  const PERMISSIONS_VALIDES = ['users', 'contrats', 'factures', 'admins'];
  let permissions = req.body.permissions;
  if (typeof permissions === 'string') {
    try { permissions = JSON.parse(permissions); }
    catch { permissions = permissions.split(',').map(p => p.trim()).filter(Boolean); }
  }
  if (!Array.isArray(permissions)) permissions = [];
  permissions = permissions.filter(p => PERMISSIONS_VALIDES.includes(p));

  try {
    const result = await GestionAdminService.ajoutAdmin({
      nom,
      prenom,
      email,
      mot_de_passe,
      adresse,
      telephone,
      carte_identite_national_num,
      photoProfil,
      role,
      permissions
    });

    if (!result.success) {
      return res.status(400).json({
        message: result.message
      });
    }

    return res.status(201).json({
      message: result.message,
      admin: formatAdmin(result.admin)
    });

  } catch (err) {
    logger.error('Erreur lors de l’inscription :', err);
    return res.status(500).json({
      message: "Erreur serveur lors de l’inscription"
    });
  }
};

// -------------------- MODIFIER LES PERMISSIONS D'UN ADMIN --------------------
exports.modifierPermissions = async (req, res) => {
  const PERMISSIONS_VALIDES = ['users', 'contrats', 'factures', 'admins'];

  let permissions = req.body.permissions;
  if (typeof permissions === 'string') {
    try { permissions = JSON.parse(permissions); }
    catch { permissions = permissions.split(',').map(p => p.trim()).filter(Boolean); }
  }
  if (!Array.isArray(permissions)) permissions = [];
  permissions = permissions.filter(p => PERMISSIONS_VALIDES.includes(p));

  try {
    const result = await GestionAdminService.modifierPermissions(req.params.id, permissions);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    return res.status(200).json({
      message: result.message,
      admin: formatAdmin(result.admin)
    });
  } catch (err) {
    logger.error('Erreur modifierPermissions :', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour des permissions' });
  }
};

// -------------------- NOMBRE ADMIN --------------------
exports.nombreAdmin = async (req, res) => {
  try {
    const result = await GestionAdminService.nombreAdmins();
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Erreur dans nombreAdmin :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des admins"
    });
  }
};