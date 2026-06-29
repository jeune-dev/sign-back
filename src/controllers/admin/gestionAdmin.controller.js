'use strict';

const GestionAdminService = require('../../services/admin/gestionAdmin.service');
const formatAdmin = require('../../utils/formatAdmin');
const asyncHandler = require('../../middlewares/asyncHandler');
const { BadRequestError, NotFoundError } = require('../../errors/AppError');

const PERMISSIONS_VALIDES = ['users', 'contrats', 'factures', 'admins'];

function parsePermissions(raw) {
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = raw.split(',').map((p) => p.trim()).filter(Boolean); }
  }
  return Array.isArray(raw) ? raw.filter((p) => PERMISSIONS_VALIDES.includes(p)) : [];
}

exports.listeAdmin = asyncHandler(async (req, res) => {
  const result = await GestionAdminService.listerAdmins({ page: req.query.page, limit: req.query.limit });
  res.status(200).json({ success: true, message: result.message, data: { admins: result.admins.map((u) => formatAdmin(u)), pagination: result.pagination } });
});

exports.ajoutAdmin = asyncHandler(async (req, res) => {
  const { nom, prenom, email, mot_de_passe, adresse, telephone, carte_identite_national_num, role } = req.body;
  const photoProfil = req.file || null;
  const permissions = parsePermissions(req.body.permissions);
  const result = await GestionAdminService.ajoutAdmin({ nom, prenom, email, mot_de_passe, adresse, telephone, carte_identite_national_num, photoProfil, role, permissions });
  if (!result.success) throw new BadRequestError(result.message);
  res.status(201).json({ success: true, message: result.message, data: { admin: formatAdmin(result.admin) } });
});

exports.modifierPermissions = asyncHandler(async (req, res) => {
  const permissions = parsePermissions(req.body.permissions);
  const result = await GestionAdminService.modifierPermissions(req.params.id, permissions);
  if (!result.success) throw new NotFoundError(result.message);
  res.status(200).json({ success: true, message: result.message, data: { admin: formatAdmin(result.admin) } });
});

exports.nombreAdmin = asyncHandler(async (req, res) => {
  const result = await GestionAdminService.nombreAdmins();
  res.status(200).json({ success: true, message: result.message, data: { total: result.totalAdmins } });
});