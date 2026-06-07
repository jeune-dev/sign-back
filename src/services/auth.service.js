const Utilisateur = require('../models/utilisateur.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtConfig, bcryptConfig } = require('../config/security');
const sequelize = require('../config/db');
const { uploadImage } = require('../middlewares/uploadService'); // ton upload vers Cloudinary


class AuthService {

  // -------------------- INSCRIPTION --------------------
static async register({
  nom,
  prenom,
  email,
  mot_de_passe,
  adresse,
  telephone,
  carte_identite_national_num,
  photoProfil,
  role = 'Particulier',
  logo,
  rc,
  ninea,
  signature,
  nomEntreprise,
  adresseEntreprise,
  telephoneEntreprise,
  emailEntreprise
}) {
  // Rôles autorisés à l'inscription publique
  const ROLES_AUTORISES = ['Particulier', 'Independant', 'Professionnel'];
  if (!ROLES_AUTORISES.includes(role)) {
    return {
      success: false,
      message: "Rôle non autorisé. Seuls Particulier, Indépendant et Professionnel peuvent s'inscrire."
    };
  }

  // Un indépendant n'a pas de RC ni de NINEA — on les ignore même s'ils sont envoyés
  const cleanRc    = (role === 'Professionnel') ? rc    : null;
  const cleanNinea = (role === 'Professionnel') ? ninea : null;

  // Un particulier n'a pas de données entreprise
  const cleanNomEntreprise      = (role === 'Particulier') ? null : nomEntreprise;
  const cleanAdresseEntreprise  = (role === 'Particulier') ? null : adresseEntreprise;
  const cleanTelEntreprise      = (role === 'Particulier') ? null : telephoneEntreprise;
  const cleanEmailEntreprise    = (role === 'Particulier') ? null : emailEntreprise;

  const t = await sequelize.transaction();

  try {
    const emailClean = email.trim().toLowerCase();

    const exist = await Utilisateur.findOne({
      where: { email: emailClean },
      transaction: t
    });

    if (exist) {
      await t.rollback();
      return {
        success: false,
        message: "Cet email est déjà utilisé"
      };
    }

    if (telephone) {
      const telExist = await Utilisateur.findOne({
        where: { telephone },
        transaction: t
      });

      if (telExist) {
        await t.rollback();
        return {
          success: false,
          message: "Ce numéro de téléphone est déjà utilisé"
        };
      }
    }

    if (carte_identite_national_num) {
      const numero_cniExist = await Utilisateur.findOne({
        where: { carte_identite_national_num },
        transaction: t
      });

      if (numero_cniExist) {
        await t.rollback();
        return {
          success: false,
          message: "Ce numéro de carte identite est déjà utilisé"
        };
      }
    }

    if (cleanEmailEntreprise) {
      const emailEntrepriseExist = await Utilisateur.findOne({
        where: { emailEntreprise: cleanEmailEntreprise },
        transaction: t
      });
      if (emailEntrepriseExist) {
        await t.rollback();
        return { success: false, message: "Cet email entreprise est déjà utilisé" };
      }
    }

    if (cleanTelEntreprise) {
      const telEntrepriseExist = await Utilisateur.findOne({
        where: { telephoneEntreprise: cleanTelEntreprise },
        transaction: t
      });
      if (telEntrepriseExist) {
        await t.rollback();
        return { success: false, message: "Ce téléphone entreprise est déjà utilisé" };
      }
    }


    const hashedPassword = await bcrypt.hash(
      mot_de_passe,
      bcryptConfig.saltRounds
    );

    let photoUrl = null;

    if (photoProfil && photoProfil.path) {
      photoUrl = await uploadImage(photoProfil.path);
    }

    let logoUrl= null;

    if (logo && logo.path) {
      logoUrl = await uploadImage(logo.path);
    }

    let signatureUrl= null;

    if (signature && signature.path) {
      signatureUrl = await uploadImage(signature.path);
    }

    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email: emailClean,
      mot_de_passe: hashedPassword,
      adresse,
      telephone,
      carte_identite_national_num,
      photoProfil: photoUrl,
      role,
      logo: logoUrl,
      rc:    cleanRc,
      ninea: cleanNinea,
      signature: signatureUrl,
      nomEntreprise:     cleanNomEntreprise,
      adresseEntreprise: cleanAdresseEntreprise,
      telephoneEntreprise: cleanTelEntreprise,
      emailEntreprise:   cleanEmailEntreprise,
    }, { transaction: t });

    await t.commit();

    return {
      success: true,
      message: "Inscription réussie",
      utilisateur
    };

  } catch (err) {
    await t.rollback();
    throw err;
  }
}


  // -------------------- CONNEXION --------------------
  static async login({ identifiant, mot_de_passe }) {
    const isEmail = /\S+@\S+\.\S+/.test(identifiant);
    const utilisateur = await Utilisateur.findOne({
      where: isEmail ? { email: identifiant } : { telephone: identifiant },
    });

    if (!utilisateur) 
      return { 
        success: false,
        error: 'Identifiant ou mot de passe incorrect' 
      };
    
    if (utilisateur.statut !== 'actif') {
      return {
        success: false,
        error: `Votre compte est ${utilisateur.statut}. Veuillez contacter le support ou réactiver votre compte.`
      };
    }

    const valid = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!valid) {
      return {
        success: false,
        message: 'Identifiant ou mot de passe incorrect'
      };
    }

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {success: true, token, utilisateur };
  }

}

module.exports = AuthService;
