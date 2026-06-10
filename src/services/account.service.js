const Utilisateur = require('../models/utilisateur.model');
const UserOtp = require('../models/userOtp.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sequelize = require('../config/db');
const { bcryptConfig } = require('../config/security');
const { sendOtpEmail } = require('./resend.service');
const { uploadImage } = require('../middlewares/uploadService');


class AccountService {

  // -------------------- PROFIL COURANT --------------------
  static async getMe(userId) {
    const utilisateur = await Utilisateur.findByPk(userId, {
      attributes: { exclude: ['mot_de_passe'] }
    });
    if (!utilisateur) {
      return { success: false, message: 'Utilisateur introuvable' };
    }
    return { success: true, utilisateur };
  }

  // -------------------- MOT DE PASSE OUBLIÉ (OTP) --------------------
  static _generateOtp(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += chars[bytes[i] % chars.length];
    }
    return otp;
  }

  static async forgotPassword(email) {
    try {
      const utilisateur = await Utilisateur.findOne({ where: { email } });
      if (!utilisateur || utilisateur.role === 'Admin') {
        // Réponse générique pour ne pas révéler l'existence du compte
        return { message: "Si un compte existe avec cet email, un code de réinitialisation a été envoyé." };
      }

      const otp = AccountService._generateOtp(8);
      const otpHash = await bcrypt.hash(otp, bcryptConfig.saltRounds);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

      // Supprimer l'ancien OTP si existant puis créer le nouveau
      await UserOtp.destroy({ where: { utilisateurId: utilisateur.id } });
      await UserOtp.create({ utilisateurId: utilisateur.id, otpHash, expiresAt });

      await sendOtpEmail({ to: email, nom: utilisateur.nom, otp });

      return { message: "Un code de réinitialisation a été envoyé à votre adresse email." };
    } catch (error) {
      console.error('Erreur forgotPassword:', error);
      throw error;
    }
  }

  // -------------------- RÉINITIALISATION MOT DE PASSE (OTP) --------------------
  static async resetPassword(email, otpRecu, newPassword) {
    try {
      const utilisateur = await Utilisateur.findOne({ where: { email } });
      if (!utilisateur) {
        return { error: "Aucun compte associé à cet email." };
      }

      const otpRecord = await UserOtp.findOne({ where: { utilisateurId: utilisateur.id } });
      if (!otpRecord) {
        return { error: "Aucun code de réinitialisation trouvé. Veuillez refaire une demande." };
      }

      if (new Date() > otpRecord.expiresAt) {
        await otpRecord.destroy();
        return { error: "Le code a expiré. Veuillez refaire une demande." };
      }

      const isValid = await bcrypt.compare(otpRecu, otpRecord.otpHash);
      if (!isValid) {
        return { error: "Code de réinitialisation incorrect." };
      }

      if (newPassword.length < 8) {
        return { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
      }

      const hashedPassword = await bcrypt.hash(newPassword, bcryptConfig.saltRounds);
      utilisateur.mot_de_passe = hashedPassword;
      await utilisateur.save();
      await otpRecord.destroy();

      return { message: "Mot de passe réinitialisé avec succès." };
    } catch (error) {
      console.error('Erreur resetPassword:', error);
      throw error;
    }
  }

  // -------------------- CHANGER MOT DE PASSE --------------------
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      // 1️⃣ Vérifier si l'utilisateur existe
      const utilisateur = await Utilisateur.findByPk(userId);
      if (!utilisateur) {
        return { error: "Utilisateur non trouvé." };
      }

      // 2️⃣ Vérifier l'ancien mot de passe
      const isMatch = await bcrypt.compare(oldPassword, utilisateur.mot_de_passe);
      if (!isMatch) {
        return { error: "Mot de passe actuel incorrect." };
      }

      // 3️⃣ Vérifier la complexité du nouveau mot de passe
      if (newPassword.length < 8) {
        return { error: "Le mot de passe doit contenir au moins 8 caractères." };
      }

      // 4️⃣ Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // 5️⃣ Mettre à jour le mot de passe
      utilisateur.mot_de_passe = hashedPassword;
      await utilisateur.save();

      return {
        message: "Mot de passe modifié avec succès."
      };

    } catch (error) {
      console.error("Erreur changePassword:", error);
      throw error;
    }
  }

  // Modifier informations personnelles
  static async updateProfile({ userId, data }) {
    const { nom, prenom, email, telephone, adresse, photoProfil, carte_identite_national_num} = data;

        const t = await sequelize.transaction();
        try {
            const utilisateur = await Utilisateur.findByPk(userId, { transaction: t });
            if (!utilisateur) {
                await t.rollback();
                return { error: "Utilisateur non trouvé" };
            }

            // Vérification email
            if (email && email !== utilisateur.email) {
                const existEmail = await Utilisateur.findOne({
                    where: { email },
                    transaction: t
            });
            if (existEmail) {
                await t.rollback();
                return { error: "Cet email est déjà utilisé" };
            }
            utilisateur.email = email;
            }

            // Vérification téléphone
            if (telephone && telephone !== utilisateur.telephone) {
            const existTel = await Utilisateur.findOne({
                where: { telephone },
                transaction: t
            });
            if (existTel) {
                await t.rollback();
                return { error: "Ce numéro de téléphone est déjà utilisé" };
            }
            utilisateur.telephone = telephone;
            }

            // Vérification CIN
            if (carte_identite_national_num && carte_identite_national_num !== utilisateur.carte_identite_national_num) {
            const existCIN = await Utilisateur.findOne({
                where: { carte_identite_national_num },
                transaction: t
            });
            if (existCIN) {
                await t.rollback();
                return { error: "Le numéro CIN est déjà utilisé" };
            }
            utilisateur.carte_identite_national_num = carte_identite_national_num;
            }

            if (nom) utilisateur.nom = nom;
            if (prenom) utilisateur.prenom = prenom;
            if (adresse !== undefined) utilisateur.adresse = adresse;
            if (photoProfil) utilisateur.photoProfil = photoProfil;
            if (carte_identite_national_num) utilisateur.carte_identite_national_num = carte_identite_national_num;

            await utilisateur.save({ transaction: t });
            await t.commit();

            return {
                message: "Profil modifié avec succès",
                utilisateur
            };

        } catch (error) {
            await t.rollback();
            throw error;
        }
  }

  
  // -------------------- MODIFIER INFOS PERSONNELLES --------------------
  static async modifierInfoPersonnelles(userId, data, files = {}) {
    const t = await sequelize.transaction();
    try {
      const utilisateur = await Utilisateur.findByPk(userId, { transaction: t });
      if (!utilisateur) {
        await t.rollback();
        return { success: false, message: "Utilisateur introuvable" };
      }

      const {
        nom, prenom, email, adresse, telephone, carte_identite_national_num,
        rc, ninea, nomEntreprise, adresseEntreprise, telephoneEntreprise, emailEntreprise
      } = data;

      if (email && email.trim().toLowerCase() !== utilisateur.email) {
        const emailClean = email.trim().toLowerCase();
        const exist = await Utilisateur.findOne({ where: { email: emailClean }, transaction: t });
        if (exist) {
          await t.rollback();
          return { success: false, message: "Cet email est déjà utilisé" };
        }
      }

      if (telephone && telephone !== utilisateur.telephone) {
        const telExist = await Utilisateur.findOne({ where: { telephone }, transaction: t });
        if (telExist) {
          await t.rollback();
          return { success: false, message: "Ce numéro de téléphone est déjà utilisé" };
        }
      }

      if (carte_identite_national_num && carte_identite_national_num !== utilisateur.carte_identite_national_num) {
        const cniExist = await Utilisateur.findOne({ where: { carte_identite_national_num }, transaction: t });
        if (cniExist) {
          await t.rollback();
          return { success: false, message: "Ce numéro de carte identité est déjà utilisé" };
        }
      }

      if (emailEntreprise && emailEntreprise !== utilisateur.emailEntreprise) {
        const emailEntExist = await Utilisateur.findOne({ where: { emailEntreprise }, transaction: t });
        if (emailEntExist) {
          await t.rollback();
          return { success: false, message: "Cet email entreprise est déjà utilisé" };
        }
      }

      if (telephoneEntreprise && telephoneEntreprise !== utilisateur.telephoneEntreprise) {
        const telEntExist = await Utilisateur.findOne({ where: { telephoneEntreprise }, transaction: t });
        if (telEntExist) {
          await t.rollback();
          return { success: false, message: "Ce téléphone entreprise est déjà utilisé" };
        }
      }

      const updates = {};
      if (nom) updates.nom = nom;
      if (prenom) updates.prenom = prenom;
      if (email) updates.email = email.trim().toLowerCase();
      if (adresse) updates.adresse = adresse;
      if (telephone) updates.telephone = telephone;
      if (carte_identite_national_num) updates.carte_identite_national_num = carte_identite_national_num;
      if (rc) updates.rc = rc;
      if (ninea) updates.ninea = ninea;
      if (nomEntreprise) updates.nomEntreprise = nomEntreprise;
      if (adresseEntreprise) updates.adresseEntreprise = adresseEntreprise;
      if (telephoneEntreprise) updates.telephoneEntreprise = telephoneEntreprise;
      if (emailEntreprise) updates.emailEntreprise = emailEntreprise;

      if (files.photoProfil && files.photoProfil[0]) {
        updates.photoProfil = await uploadImage(files.photoProfil[0].path);
      }
      if (files.logo && files.logo[0]) {
        updates.logo = await uploadImage(files.logo[0].path);
      }
      if (files.signature && files.signature[0]) {
        updates.signature = await uploadImage(files.signature[0].path);
      }

      await utilisateur.update(updates, { transaction: t });
      await t.commit();

      return { success: true, message: "Informations mises à jour avec succès", utilisateur };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

}

module.exports = AccountService;
