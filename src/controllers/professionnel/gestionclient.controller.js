const GestionClientService = require('../../services/professionnel/gestionclient.service');


// -------------------- CREATION CLIENT --------------------
exports.ajoutClient = async (req, res) => {
  try {
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

    const photoProfil = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const result = await GestionClientService.ajoutClient({
      nom,
      prenom,
      email,
      mot_de_passe,
      adresse,
      telephone,
      photoProfil,
      carte_identite_national_num,
      role
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      message: 'Client créé avec succès',
      utilisateur: result.utilisateur
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// -------------------- MODIFICATION CLIENT --------------------
exports.modificationClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    if (req.file) {
      data.photoProfil = `/uploads/${req.file.filename}`;
    }

    const result = await GestionClientService.modificationClient({
      userId,
      data
    });

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// -------------------- RECHERCHE CLIENT --------------------
exports.rechercherClient = async (req, res) => {
  try {
    const {
      carte_identite_national_num,
      telephone,
      nom,
      prenom,
      email
    } = req.query;

    const result = await GestionClientService.rechercherClient({
      carte_identite_national_num,
      telephone,
      nom,
      prenom,
      email
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// -------------------- LISTE DES CLIENTS (PAGINATION) --------------------
exports.listerClients = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await GestionClientService.listerClients({
      page,
      limit
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erreur controller listerClients:', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de la récupération des clients'
    });
  }
};
