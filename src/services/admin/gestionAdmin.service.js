const Utilisateur = require('../../models/utilisateur.model');
const { Op } = require('sequelize');
const paginate = require('../../utils/paginate');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/db');
const { uploadImage } = require('../../middlewares/uploadService');
const { bcryptConfig } = require('../../config/security');

class GestionAdminService {

    static async listerAdmins({ page, limit } = {}) {
        const { page: p, limit: l, offset } = paginate(page, limit);

        const { count, rows } = await Utilisateur.findAndCountAll({
            attributes: { exclude: ['mot_de_passe'] },
            where: { role: 'Admin' },
            order: [['createdAt', 'DESC']],
            limit: l,
            offset
        });

        return {
            message: "Liste des admins",
            admins: rows,
            pagination: { total: count, totalPages: Math.ceil(count / l), page: p, limit: l }
        };
    }

    static async ajoutAdmin({
        nom,
        prenom,
        email,
        mot_de_passe,
        adresse,
        telephone,
        carte_identite_national_num,
        photoProfil,
        role = 'Admin',
    }) {
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


        const hashedPassword = await bcrypt.hash(
        mot_de_passe,
        bcryptConfig.saltRounds
        );

        let photoUrl = null;

        if (photoProfil && photoProfil.path) {
        photoUrl = await uploadImage(photoProfil.path);
        }

        const admin = await Utilisateur.create({
        nom,
        prenom,
        email: emailClean,
        mot_de_passe: hashedPassword,
        adresse,
        telephone,
        carte_identite_national_num,
        photoProfil: photoUrl,
        role
        }, { transaction: t });

        await t.commit();

        return {
        success: true,
        message: "Admin cree avec succee",
        admin
        };

    } catch (err) {
        await t.rollback();
        throw err;
    }
    }

    static async nombreAdmins() {
        const total = await Utilisateur.count({
        where: { role: 'Admin'}
        });

        return {
        message: "Nombre total d'Admin",
        totalAdmins: total
        };
    }

}

module.exports = GestionAdminService;