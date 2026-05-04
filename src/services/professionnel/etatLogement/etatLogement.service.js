const { EtatDesLieux, Contrat, Utilisateur } = require('../../../models');
const sequelize = require('../../../config/db');
const { Op } = require('sequelize');

const etatDesLieuxTemplate = require('../../../templates/pdf/etatLogement/etatLogement.template');

class EtatDesLieuxService {

  // ============================================================
  // 🔹 NUMÉRO
  // ============================================================
  static async genererNumeroEtatDesLieux() {
    try {
      const annee = new Date().getFullYear();

      const dernier = await EtatDesLieux.findOne({
        where: {
          numero_etat_des_lieux: {
            [Op.like]: `EDL-${annee}-%`
          }
        },
        order: [['createdAt', 'DESC']],
        attributes: ['numero_etat_des_lieux']
      });

      let compteur = 1;

      if (dernier?.numero_etat_des_lieux) {
        const parts = dernier.numero_etat_des_lieux.split('-');
        const last = parseInt(parts[2], 10);
        if (!isNaN(last)) compteur = last + 1;
      }

      return `EDL-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      throw new Error('Erreur génération numéro état des lieux');
    }
  }

  // ============================================================
  // 🔹 CREATE
  // ============================================================
  static async creerEtatDesLieux({
    utilisateurConnecte,
    contratId,
    data,
    signature_bailleur
  }) {

    const transaction = await sequelize.transaction();

    try {

      const contrat = await Contrat.findByPk(contratId, {
        include: [
          {
            model: Utilisateur,
            as: 'locataires'
          }
        ]
      });

      if (!contrat) {
        await transaction.rollback();
        return { success: false, message: 'Contrat introuvable' };
      }

      if (contrat.bailleurId !== utilisateurConnecte.id) {
        await transaction.rollback();
        return { success: false, message: 'Accès non autorisé' };
      }

      if (!data?.date_etat_des_lieux || !data?.heure_visite) {
        await transaction.rollback();
        return { success: false, message: 'Date et heure obligatoires' };
      }

      const numero = await this.genererNumeroEtatDesLieux();

      const etat = await EtatDesLieux.create({
        numero_etat_des_lieux: numero,
        contratId: contrat.id,

        date_etat_des_lieux: data.date_etat_des_lieux,
        heure_visite: data.heure_visite,

        observations_generales: data.observations_generales || null,

        nombre_salons: data.nombre_salons ?? 0,
        nombre_chambres: data.nombre_chambres ?? 0,
        nombre_cuisines: data.nombre_cuisines ?? 0,
        nombre_salles_bain: data.nombre_salles_bain ?? 0,
        nombre_wc: data.nombre_wc ?? 0,
        nombre_balcons: data.nombre_balcons ?? 0,

        autres_pieces: data.autres_pieces || null,

        pieces: Array.isArray(data.pieces) ? data.pieces : [],

        signature_bailleur,
        statut: 'inspection'
      }, { transaction });

      // ============================================================
      // 🔹 SAFE LOCATAIRES
      // ============================================================
      const locataires = Array.isArray(contrat.locataires)
        ? contrat.locataires
        : [];

      // ============================================================
      // 🔹 PDF DATA
      // ============================================================
      const pdfData = {
        numero_etat: numero,

        bailleur: {
          nom: utilisateurConnecte.nom || '',
          prenom: utilisateurConnecte.prenom || '',
          email: utilisateurConnecte.email || '',
          telephone: utilisateurConnecte.telephone || ''
        },

        locataires: locataires.map(l => ({
          nom: l.nom || '',
          prenom: l.prenom || '',
          email: l.email || '',
          telephone: l.telephone || '',
          adresse: l.adresse || ''
        })),

        logement: {
          adresse: contrat.bien_adresse,
          ville: contrat.bien_ville,
          type: contrat.bien_type,
          superficie: contrat.bien_superficie,
          nombre_pieces: contrat.bien_nombre_pieces,
          etage: contrat.bien_etage,
          meuble: contrat.bien_meuble,
          parking: contrat.bien_parking,
          cave: contrat.bien_cave,
          balcon_terrasse: contrat.bien_balcon_terrasse,
          usage: contrat.bien_usage,
          description: contrat.bien_description
        },

        etat: {
          date: data.date_etat_des_lieux,
          heure: data.heure_visite,
          observations_generales: data.observations_generales || null,

          pieces: Array.isArray(data.pieces)
            ? data.pieces.map(p => ({
                nom: p.nom,
                etat_sol: p.etat_sol,
                etat_murs: p.etat_murs,
                etat_plafond: p.etat_plafond,
                etat_fenetres: p.etat_fenetres,
                etat_portes: p.etat_portes,
                etat_electricite: p.etat_electricite,
                etat_eclairage: p.etat_eclairage,
                proprete: p.proprete,
                humidite: p.humidite,
                degradations: p.degradations,
                observations: p.observations || '',
                photos: p.photos || []
              }))
            : []
        }
      };

      // ============================================================
      // 🔹 PDF SAFE
      // ============================================================
      let pdfBase64 = null;

      try {
        const pdfBuffer = await etatDesLieuxTemplate(pdfData);
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (err) {
        console.error("PDF ERROR:", err);
      }

      await etat.update(
        { etat_des_lieux_pdf: pdfBase64 },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: 'État des lieux créé avec succès',
        data: {
          id: etat.id,
          numero: etat.numero_etat_des_lieux,
          statut: etat.statut
        }
      };

    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 PIÈCES
  // ============================================================
  static async enregistrerPieces({ etatId, pieces }) {
    const etat = await EtatDesLieux.findByPk(etatId);

    if (!etat) {
      return { success: false, message: 'Introuvable' };
    }

    await etat.update({
      pieces: Array.isArray(pieces) ? pieces : [],
      statut: 'valide'
    });

    return { success: true, message: 'OK' };
  }

  // ============================================================
  // 🔹 SIGNATURE
  // ============================================================
  static async signerEtatDesLieux({ etatId, signature }) {
    const etat = await EtatDesLieux.findByPk(etatId);

    if (!etat) {
      return { success: false, message: 'Introuvable' };
    }

    await etat.update({
      signature_locataire: signature,
      statut: 'signe'
    });

    return { success: true, message: 'Signé' };
  }

  // ============================================================
  // 🔹 GET BY ID
  // ============================================================
  static async getEtatDesLieuxById({ etatId }) {
    const etat = await EtatDesLieux.findByPk(etatId);

    if (!etat) {
      return { success: false, message: 'Introuvable' };
    }

    return { success: true, data: etat };
  }

  // ============================================================
  // 🔹 LISTE
  // ============================================================
  static async getMesEtatsDesLieux({ utilisateurConnecte }) {
    const etats = await EtatDesLieux.findAll({
      include: [{
        model: Contrat,
        where: { bailleurId: utilisateurConnecte.id }
      }]
    });

    return { success: true, data: etats };
  }

  // ============================================================
  // 🔹 PDF
  // ============================================================
  static async telechargerEtatDesLieux({ etatId }) {
    const etat = await EtatDesLieux.findByPk(etatId);

    if (!etat?.etat_des_lieux_pdf) {
      return { success: false, message: 'PDF introuvable' };
    }

    return {
      success: true,
      data: {
        pdfBuffer: Buffer.from(etat.etat_des_lieux_pdf, 'base64'),
        numero: etat.numero_etat_des_lieux
      }
    };
  }
}

module.exports = EtatDesLieuxService;