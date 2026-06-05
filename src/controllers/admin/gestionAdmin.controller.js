const GestionAdminService = require('../../services/admin/gestionAdmin.service');
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
    console.error("Erreur dans listeAdmin :", error);
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
      role
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
    console.error('Erreur lors de l’inscription :', err);
    return res.status(500).json({
      message: ‘Erreur serveur lors de l’inscription’
    });
  }
};

// -------------------- NOMBRE ADMIN --------------------
exports.nombreAdmin = async (req, res) => {
  try {
    const result = await GestionAdminService.nombreAdmins();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans nombreAdmin :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des admins"
    });
  }
};