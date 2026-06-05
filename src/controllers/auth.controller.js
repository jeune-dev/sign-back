const AuthService = require('../services/auth.service');
const formatUser = require('../utils/formatUser');

exports.inscriptionUser = async (req, res) => {
  const {
    nom,
    prenom,
    email,
    mot_de_passe,
    adresse,
    telephone,
    carte_identite_national_num,
    role,
    rc,
    ninea,
    nomEntreprise,
    adresseEntreprise,
    telephoneEntreprise,
    emailEntreprise
  } = req.body;

  const photoProfil = req.files['photoProfil'] ? req.files['photoProfil'][0] : null;
  const logo = req.files['logo'] ? req.files['logo'][0] : null;
  const signature = req.files['signature'] ? req.files['signature'][0] : null;



  try {
    const result = await AuthService.register({
      nom,
      prenom,
      email,
      mot_de_passe,
      adresse,
      telephone,
      carte_identite_national_num,
      photoProfil,
      role,
      logo,
      rc,
      ninea,
      signature,
      nomEntreprise,
      adresseEntreprise,
      telephoneEntreprise,
      emailEntreprise
    });

    if (!result.success) {
      return res.status(400).json({
        message: result.message
      });
    }

    return res.status(201).json({
      message: result.message,
      utilisateur: formatUser(result.utilisateur)
    });

  } catch (err) {
    console.error('Erreur lors de l\'inscription :', err);
    return res.status(500).json({
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};


exports.login = async (req, res) => {
  const { identifiant, mot_de_passe } = req.body; 

  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({ message: 'Email/Téléphone et mot de passe sont obligatoires' });
  }

  try {
    const { token, utilisateur, error } = await AuthService.login({ identifiant, mot_de_passe });

    if (error) return res.status(400).json({ message: error });

    return res.status(200).json({
      token,
      utilisateur: formatUser(utilisateur)
    });
  } catch (err) {
    console.error('Erreur connexion:', err);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};

exports.hello = (req, res) => {
  res.status(200).json({ message: 'Hello, world!' });
}
