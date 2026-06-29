const { EtatDesLieux, Contrat, Utilisateur } = require('../../../models');
const sequelize = require('../../../config/db');
const { Op } = require('sequelize');
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../../../services/r2.service');

const etatDesLieuxTemplate = require('../../../templates/pdf/etatLogement/etatLogement.template');
const formatEmailEtatLogement = require('./emailFormatEtatLogement');
const logger = require('../../../utils/logger');

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

        signature_bailleur: await uploadSignature(signature_bailleur),
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
      const premierLocataire = locataires[0] || null;

      const pdfData = {
        numero_etat: numero,

        proprietaire: {
          nom: utilisateurConnecte.nom || '',
          prenom: utilisateurConnecte.prenom || '',
          email: utilisateurConnecte.email || '',
          telephone: utilisateurConnecte.telephone || '',
          adresse: utilisateurConnecte.adresse || ''
        },

        locataire: premierLocataire ? {
          nom: premierLocataire.nom || '',
          prenom: premierLocataire.prenom || '',
          email: premierLocataire.email || '',
          telephone: premierLocataire.telephone || '',
          adresse: premierLocataire.adresse || ''
        } : null,

        locataires: locataires.map(l => ({
          nom: l.nom || '',
          prenom: l.prenom || '',
          email: l.email || '',
          telephone: l.telephone || '',
          adresse: l.adresse || ''
        })),

        signature_bailleur: signature_bailleur || null,

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
      let pdfKey = null;

      try {
        const pdfBuffer = await etatDesLieuxTemplate(pdfData);
        pdfKey = await uploadPdf(pdfBuffer, makePdfKey('etat-des-lieux', etat.numero_etat_des_lieux));
      } catch (err) {
        logger.error("PDF ERROR:", err);
      }

      await etat.update(
        { etat_des_lieux_pdf: pdfKey },
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
  // 🔹 SIGNATURE LOCATAIRE
  // ============================================================
  static async signerEtatDesLieux({ etatId, signature }) {

    // 1. Charger l'état des lieux + contrat + bailleur + locataires
    const etat = await EtatDesLieux.findByPk(etatId, {
      include: [{
        model: Contrat,
        as: 'contrat',
        include: [
          { model: Utilisateur, as: 'bailleur' },
          { model: Utilisateur, as: 'locataires' }
        ]
      }]
    });

    if (!etat) {
      return { success: false, message: 'Introuvable' };
    }

    // 2. Upload signature locataire dans R2
    const sigLocUrl = await uploadSignature(signature);

    // 3. Télécharger la signature bailleur depuis R2 → base64
    let signatureBailleurBase64 = null;
    if (etat.signature_bailleur) {
      try {
        const buf = await downloadPdf(etat.signature_bailleur);
        signatureBailleurBase64 = `data:image/png;base64,${buf.toString('base64')}`;
      } catch (err) {
        logger.error('Erreur téléchargement signature bailleur:', err);
      }
    }

    const contrat = etat.contrat;
    const bailleur = contrat?.bailleur || {};
    const locataires = Array.isArray(contrat?.locataires) ? contrat.locataires : [];
    const premierLocataire = locataires[0] || null;

    // 4. Régénérer le PDF avec les 2 signatures
    let pdfBuffer = null;
    let newPdfKey = etat.etat_des_lieux_pdf;

    try {
      const pdfData = {
        numero_etat: etat.numero_etat_des_lieux,

        proprietaire: {
          nom: bailleur.nom || '',
          prenom: bailleur.prenom || '',
          email: bailleur.email || '',
          telephone: bailleur.telephone || '',
          adresse: bailleur.adresse || ''
        },

        locataire: premierLocataire ? {
          nom: premierLocataire.nom || '',
          prenom: premierLocataire.prenom || '',
          email: premierLocataire.email || '',
          telephone: premierLocataire.telephone || '',
          adresse: premierLocataire.adresse || ''
        } : null,

        locataires: locataires.map(l => ({
          nom: l.nom || '',
          prenom: l.prenom || '',
          email: l.email || '',
          telephone: l.telephone || '',
          adresse: l.adresse || ''
        })),

        logement: {
          adresse: contrat?.bien_adresse,
          ville: contrat?.bien_ville,
          type: contrat?.bien_type,
          superficie: contrat?.bien_superficie,
          nombre_pieces: contrat?.bien_nombre_pieces,
          etage: contrat?.bien_etage,
          meuble: contrat?.bien_meuble,
          parking: contrat?.bien_parking,
          cave: contrat?.bien_cave,
          balcon_terrasse: contrat?.bien_balcon_terrasse,
          usage: contrat?.bien_usage,
          description: contrat?.bien_description
        },

        etat: {
          date: etat.date_etat_des_lieux,
          heure: etat.heure_visite,
          observations_generales: etat.observations_generales,
          pieces: Array.isArray(etat.pieces) ? etat.pieces : []
        },

        signature_bailleur: signatureBailleurBase64,
        signature_locataire: signature
      };

      pdfBuffer = await etatDesLieuxTemplate(pdfData);
      newPdfKey = makePdfKey('etat-des-lieux', etat.numero_etat_des_lieux);
      await uploadPdf(pdfBuffer, newPdfKey);

    } catch (err) {
      logger.error('Erreur régénération PDF état des lieux:', err);
    }

    // 5. Sauvegarder signature + statut + nouveau PDF
    await etat.update({
      signature_locataire: sigLocUrl,
      statut: 'signe',
      etat_des_lieux_pdf: newPdfKey
    });

    // 6. Envoyer emails avec le PDF final aux 2 parties
    if (pdfBuffer && premierLocataire) {
      try {
        await formatEmailEtatLogement({
          proprietaire: {
            nom: bailleur.nom || '',
            prenom: bailleur.prenom || '',
            email: bailleur.email || ''
          },
          locataire: {
            nom: premierLocataire.nom || '',
            prenom: premierLocataire.prenom || '',
            email: premierLocataire.email || ''
          },
          etatLogement: {
            numero: etat.numero_etat_des_lieux,
            adresse: contrat?.bien_adresse || '',
            type: contrat?.bien_type || '',
            date: etat.date_etat_des_lieux
          },
          pdfBase64: pdfBuffer.toString('base64')
        });
      } catch (err) {
        logger.error('Erreur envoi email état des lieux signé:', err);
      }
    }

    return {
      success: true,
      message: 'État des lieux signé avec succès. Un email a été envoyé aux deux parties.'
    };
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
        as: 'contrat',
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

    const pdfBuffer = await downloadPdf(etat.etat_des_lieux_pdf);
    return {
      success: true,
      data: { pdfBuffer, numero: etat.numero_etat_des_lieux }
    };
  }
}

module.exports = EtatDesLieuxService;