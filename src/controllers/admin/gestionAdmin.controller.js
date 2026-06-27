const GestionAdminService = require('../../services/admin/gestionAdmin.service');
const logger = require('../../utils/logger');
const formatAdmin = require('../../utils/formatAdmin');

exports.listeAdmin = async (req, res) => {
  try {
    const result = await GestionAdminService.listerAdmins({ page: req.query.page, limit: req.query.limit });
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { admins: result.admins.map(u => formatAdmin(u)), pagination: result.pagination }
    });
  } catch (error) {
    logger.error('Erreur dans listeAdmin :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des admins' });
  }
};

exports.ajoutAdmin = async (req, res) => {
  const { nom, prenom, email, mot_de_passe, adresse, telephone, carte_identite_national_num, role } = req.body;
  const photoProfil = req.file || null;
  const PERMISSIONS_VALIDES = ['users', 'contrats', 'factures', 'admins'];
  let permissions = req.body.permissions;
  if (typeof permissions === 'string') {
    try { permissions = JSON.parse(permissions); }
    catch { permissions = permissions.split(',').map(p => p.trim()).filter(Boolean); }
  }
  if (!Array.isArray(permissions)) permissions = [];
  permissions = permissions.filter(p => PERMISSIONS_VALIDES.includes(p));
  try {
    const result = await GestionAdminService.ajoutAdmin({ nom, prenom, email, mot_de_passe, adresse, telephone, carte_identite_national_num, photoProfil, role, permissions });
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    return res.status(201).json({ success: true, message: result.message, data: { admin: formatAdmin(result.admin) } });
  } catch (err) {
    logger.error("Erreur lors de l'inscription :", err);
    return res.status(500).json({ success: false, message: "Erreur serveur lors de l'inscription" });
  }
};

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
    if (!result.success) return res.status(404).json({ success: false, message: result.message });
    return res.status(200).json({ success: true, message: result.message, data: { admin: formatAdmin(result.admin) } });
  } catch (err) {
    logger.error('Erreur modifierPermissions :', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour des permissions' });
  }
};

exports.nombreAdmin = async (req, res) => {
  try {
    const result = await GestionAdminService.nombreAdmins();
    return res.status(200).json({ success: true, message: result.message, data: { total: result.totalAdmins } });
  } catch (error) {
    logger.error('Erreur dans nombreAdmin :', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du comptage des admins' });
  }
};
