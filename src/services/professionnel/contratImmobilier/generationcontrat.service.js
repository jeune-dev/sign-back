const { Contrat, Utilisateur } = require('../../../models');
const paginate = require('../../../utils/paginate');
const sequelize         = require('../../../config/db');
const { Op }            = require('sequelize');

const contratBailTemplate = require('../../../templates/pdf/contratBail/contratBail.template');
const envoyerContratEmail = require('./emailFormatContratBail');
const { sendPushToUsers } = require('../../../services/notification.service');
const { uploadPdf, uploadSignature, downloadPdf, makePdfKey } = require('../../../services/r2.service');
const logger = require('../../../utils/logger');

class GestionContratService {

  // ============================================================
  // 🔹 GÉNÉRER NUMÉRO DE CONTRAT
  // ============================================================
  static async genererNumeroContrat() {
    try {
      const annee = new Date().getFullYear();

      const dernierContrat = await Contrat.findOne({
        where:      { numero_contrat: { [Op.like]: `CONTRAT-BAIL-${annee}-%` } },
        order:      [['createdAt', 'DESC']],
        attributes: ['numero_contrat']
      });

      let compteur = 1;
      if (dernierContrat?.numero_contrat) {
        const parts = dernierContrat.numero_contrat.split('-');
        compteur    = parseInt(parts[3], 10) + 1 || 1;
      }

      return `CONTRAT-BAIL-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      logger.error('❌ Erreur genererNumeroContrat:', error);
      throw new Error('Erreur lors de la génération du numéro de contrat');
    }
  }

// ============================================================
// 🔹 CRÉER UN CONTRAT DE BAIL
// ============================================================
static async creerContrat({
  utilisateurConnecte,
  locatairesIds,
  bien,
  bail,
  paiement,
  depot_garantie,
  clauses,
  signature,
  signature_bailleur,
}) {
  const transaction = await sequelize.transaction();

  try {

    // ── 1. Récupérer le bailleur complet ────────────────────
    const bailleur = await Utilisateur.findByPk(utilisateurConnecte.id);
    if (!bailleur) {
      await transaction.rollback();
      return { success: false, message: 'Bailleur introuvable' };
    }

    // ── 2. Récupérer les locataires ─────────────────────────
    if (!Array.isArray(locatairesIds) || locatairesIds.length === 0) {
      await transaction.rollback();
      return { success: false, message: 'Au moins un locataire est requis' };
    }

    const locataires = await Utilisateur.findAll({
      where: { id: { [Op.in]: locatairesIds } }
    });

    if (locataires.length !== locatairesIds.length) {
      await transaction.rollback();
      return { success: false, message: 'Un ou plusieurs locataires sont introuvables' };
    }

    // ── 3. Validations métier ───────────────────────────────
    if (!paiement?.montant_loyer || Number(paiement.montant_loyer) <= 0) {
      await transaction.rollback();
      return { success: false, message: 'Le montant du loyer est invalide' };
    }

    if (!bail?.date_debut) {
      await transaction.rollback();
      return { success: false, message: 'La date de début du bail est requise' };
    }

    if (!bien?.adresse || !bien?.type || !bien?.usage) {
      await transaction.rollback();
      return { success: false, message: 'Les informations sur le bien sont incomplètes' };
    }

    // ── 4. Numéro de contrat ────────────────────────────────
    const numero_contrat = await this.genererNumeroContrat();

    // ── 5. Création du contrat ──────────────────────────────
    const contrat = await Contrat.create({
      numero_contrat,
      bailleurId: bailleur.id,

      // Bien
      bien_adresse:         bien.adresse,
      bien_ville:           bien.ville           || null,
      bien_code_postal:     bien.code_postal     || null,
      bien_pays:            bien.pays            || 'Sénégal',
      bien_type:            bien.type,
      bien_superficie:      Number(bien.superficie)    || null,
      bien_nombre_pieces:   Number(bien.nombre_pieces) || null,
      bien_etage:           bien.etage !== undefined ? Number(bien.etage) : null,
      bien_meuble:          bien.meuble,
      bien_parking:         bien.parking,
      bien_cave:            bien.cave,
      bien_balcon_terrasse: bien.balcon_terrasse,
      bien_usage:           bien.usage,
      bien_description:     bien.description     || null,

      // Bail
      date_debut_bail:            new Date(bail.date_debut),
      duree_bail:                 bail.duree           || null,
      date_fin_bail:              bail.date_fin ? new Date(bail.date_fin) : null,
      renouvellement_automatique: bail.renouvelable,
      duree_preavis:              bail.duree_preavis   || null,

      // Paiement
      loyer_mensuel:        Number(paiement.montant_loyer),
      devise:               paiement.devise               || 'FCFA',
      charges_incluses:     paiement.charges_incluses,
      montant_charges:      Number(paiement.montant_charges)  || 0,
      autres_charges:       paiement.autres_charges           || null,
      jour_paiement:        Number(paiement.jour_paiement)    || 1,
      periodicite_paiement: paiement.periodicite              || 'Mensuel',
      moyen_paiement_loyer: paiement.moyen,
      info_paiement:        paiement.info_paiement            || null,

      // Dépôt de garantie
      depot_garantie_prevu:          depot_garantie?.prevu,
      depot_garantie_montant:        Number(depot_garantie?.montant)  || 0,
      depot_garantie_date_versement: depot_garantie?.date_versement   || null,
      depot_garantie_mode_paiement:  depot_garantie?.mode_paiement    || null,

      // Clauses
      sous_location_autorisee:   clauses?.sous_location === 'Oui',
      animaux_autorises:         clauses?.animaux       === 'Oui',
      travaux_sans_autorisation: clauses?.travaux       === 'Oui',
      clauses_particulieres:     clauses?.personnalisees || null,

      // Signature
      signature_ville:         signature?.ville         || null,
      signature_date:          signature?.date          || null,
      signature_nom_bailleur:  signature?.nom_bailleur  || `${bailleur.prenom} ${bailleur.nom}`,
      signature_nom_locataire: signature?.nom_locataire || locataires.map(l => `${l.prenom} ${l.nom}`).join(', '),

      statut:      'en_attente',
      contrat_pdf: null,

    }, { transaction });

    // ── 6. Lier les locataires (Many-to-Many) ───────────────
    await contrat.addLocataires(locatairesIds, { transaction });

    // ── Commit de la transaction ────────────────────────────
    await transaction.commit();

    // ── 7. Génération du PDF ────────────────────────────────
    const pdfBuffer = await contratBailTemplate({
      numero_contrat,

      // Bailleur
      bailleur: {
        nom:               bailleur.nom,
        prenom:            bailleur.prenom,
        email:             bailleur.email,
        telephone:         bailleur.telephone,
        adresse:           bailleur.adresse,
        cni:               bailleur.carte_identite_national_num,
        role:              bailleur.role,
        nomEntreprise:     bailleur.nomEntreprise         || null,
        adresseEntreprise: bailleur.adresseEntreprise     || null,
        telEntreprise:     bailleur.telephoneEntreprise   || null,
        emailEntreprise:   bailleur.emailEntreprise       || null,
        rc:                bailleur.rc                    || null,
        ninea:             bailleur.ninea                 || null,
        signature:         signature_bailleur || bailleur.signature || null, // ← signature tracée à la création (base64) ou profil
      },

      // Locataires
      locataires: locataires.map(l => ({
        nom:       l.nom,
        prenom:    l.prenom,
        email:     l.email,
        telephone: l.telephone,
        adresse:   l.adresse,
        cni:       l.carte_identite_national_num,
        nomEntreprise:     l.nomEntreprise       || null,
        adresseEntreprise: l.adresseEntreprise   || null,
        telEntreprise:     l.telephoneEntreprise || null,
        emailEntreprise:   l.emailEntreprise     || null,
        rc:                l.rc                  || null,
        ninea:             l.ninea               || null,
      })),

      // Bien — données brutes (le template gère l'affichage)
      bien: {
        adresse:         bien.adresse,
        ville:           bien.ville           || null,
        code_postal:     bien.code_postal     || null,
        pays:            bien.pays            || 'Sénégal',
        type:            bien.type,
        superficie:      bien.superficie      || null,
        nombre_pieces:   bien.nombre_pieces   || null,
        etage:           bien.etage           !== undefined ? bien.etage : null,
        meuble:          bien.meuble,
        parking:         bien.parking,
        cave:            bien.cave,
        balcon_terrasse: bien.balcon_terrasse,
        usage:           bien.usage,
        description:     bien.description     || null,
      },

      // Bail — dates formatées pour l'affichage
      bail: {
        date_debut:    new Date(bail.date_debut).toLocaleDateString('fr-FR'),
        duree:         bail.duree          || null,
        date_fin:      bail.date_fin
          ? new Date(bail.date_fin).toLocaleDateString('fr-FR')
          : 'Indéterminée',
        renouvelable:  bail.renouvelable,
        duree_preavis: bail.duree_preavis  || null,
      },

      // Paiement
      paiement: {
        montant_loyer:    Number(paiement.montant_loyer),
        devise:           paiement.devise             || 'FCFA',
        charges_incluses: paiement.charges_incluses,
        montant_charges:  Number(paiement.montant_charges) || 0,
        autres_charges:   paiement.autres_charges     || [],
        jour_paiement:    paiement.jour_paiement       || 1,
        periodicite:      paiement.periodicite         || 'Mensuel',
        moyen:            paiement.moyen               || null,
        info_paiement:    paiement.info_paiement       || {},
      },

      // Dépôt de garantie
      depot_garantie: {
        prevu:          depot_garantie?.prevu,
        montant:        Number(depot_garantie?.montant) || 0,
        date_versement: depot_garantie?.date_versement
          ? new Date(depot_garantie.date_versement).toLocaleDateString('fr-FR')
          : null,
        mode_paiement:  depot_garantie?.mode_paiement || null,
      },

      // Clauses — textes lisibles pour le PDF
      clauses: {
        sous_location:  clauses?.sous_location  ? 'Autorisée'               : 'Non autorisée',
        animaux:        clauses?.animaux        ? 'Autorisés'               : 'Non autorisés',
        travaux:        clauses?.travaux        ? 'Autorisés sans accord'   : 'Soumis à autorisation préalable écrite',
        personnalisees: clauses?.personnalisees || null,
      },

      // Signature — ville du bien par défaut si non précisée
      signature: {
        ville:         signature?.ville || bien?.ville || null,
        date:          signature?.date
          ? new Date(signature.date).toLocaleDateString('fr-FR')
          : new Date().toLocaleDateString('fr-FR'),
        nom_bailleur:  signature?.nom_bailleur  || `${bailleur.prenom} ${bailleur.nom}`,
        nom_locataire: signature?.nom_locataire || locataires.map(l => `${l.prenom} ${l.nom}`).join(', '),
      },
    });

    // ── 8. Stocker le PDF + signature bailleur sur R2 ──────
    const sigBailleurUrl = signature_bailleur ? await uploadSignature(signature_bailleur) : null;
    const pdfKey = await uploadPdf(pdfBuffer, makePdfKey('contrat-bail', numero_contrat));
    await Contrat.update(
      { contrat_pdf: pdfKey, ...(sigBailleurUrl ? { signature_bailleur: sigBailleurUrl } : {}) },
      { where: { id: contrat.id } }
    );

    // ── 9. Envoi des emails ─────────────────────────────────
    try {
      await envoyerContratEmail({
        emailsLocataires: locataires.map(l => l.email),
        emailBailleur:    bailleur.email,
        numero_contrat,
        pdfBase64: pdfBuffer.toString('base64'),
        nomSignature: bailleur.nomEntreprise || `${bailleur.prenom} ${bailleur.nom}`
      });
      logger.info('✅ Emails envoyés avec succès');
    } catch (err) {
      logger.error('❌ Erreur lors de l\'envoi des emails :', err);
    }

    sendPushToUsers(locataires.map(l => l.id), {
      title: 'SIGN — Contrat à signer',
      body: `Vous avez un contrat de bail immobilier à signer de la part de ${bailleur.prenom} ${bailleur.nom}`,
      data: { type: 'contrat-bail', contratId: String(contrat.id) }
    }).catch(() => {});

    return {
      success: true,
      message: 'Contrat de bail créé avec succès',
      data: {
        contratId:        contrat.id,
        numero_contrat,
        nombreLocataires: locataires.length,
      },
    };

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    logger.error('❌ Erreur creerContrat:', error);
    return { success: false, message: error.message };
  }
}

  // ============================================================
  // 🔹 LISTER MES CONTRATS
  // ============================================================
  static async getMesContrats({ utilisateurConnecte, page, limit }) {
    try {
      const { page: p, limit: l, offset } = paginate(page, limit);

      const { count, rows } = await Contrat.findAndCountAll({
        where:   { bailleurId: utilisateurConnecte.id },
        include: [{ model: Utilisateur, as: 'locataires', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'], through: { attributes: [] } }],
        order: [['createdAt', 'DESC']],
        limit: l,
        offset,
        distinct: true
      });

      return {
        success: true,
        data: rows,
        pagination: { total: count, totalPages: Math.ceil(count / l), page: p, limit: l }
      };

    } catch (error) {
      logger.error('❌ Erreur getMesContrats:', error);
      return { success: false, message: `Erreur lors de la récupération des contrats : ${error.message}` };
    }
  }

  // ============================================================
  // 🔹 DÉTAIL D'UN CONTRAT
  // ============================================================
  static async getContratById({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await Contrat.findOne({
        where:   { id: contratId, bailleurId: utilisateurConnecte.id },
        include: [
          {
            model:      Utilisateur,
            as:         'locataires',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse'],
            through:    { attributes: [] }
          }
        ]
      });

      if (!contrat) {
        return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      }

      return { success: true, data: contrat };

    } catch (error) {
      logger.error('❌ Erreur getContratById:', error);
      return { success: false, message: 'Erreur lors de la récupération du contrat' };
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER LE PDF
  // ============================================================
  static async telechargerContrat({ contratId, utilisateurConnecte }) {
    try {
      const contrat = await Contrat.findOne({
        where: { id: contratId, bailleurId: utilisateurConnecte.id }
      });

      if (!contrat) {
        return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      }

      if (!contrat.contrat_pdf) {
        return { success: false, message: 'Aucun PDF disponible pour ce contrat' };
      }

      const pdfBuffer = await downloadPdf(contrat.contrat_pdf);
      return {
        success: true,
        data: { pdfBuffer, numero_contrat: contrat.numero_contrat }
      };

    } catch (error) {
      logger.error('❌ Erreur telechargerContrat:', error);
      return { success: false, message: 'Erreur lors du téléchargement du contrat' };
    }
  }

  // ============================================================
  // 🔹 RÉSILIER UN CONTRAT
  // ============================================================
  static async resilierContrat({ contratId, utilisateurConnecte, motif_resiliation }) {
    try {
      const contrat = await Contrat.findOne({
        where: { id: contratId, bailleurId: utilisateurConnecte.id }
      });

      if (!contrat) {
        return { success: false, message: 'Contrat introuvable ou accès non autorisé' };
      }

      if (contrat.statut === 'Résilié') {
        return { success: false, message: 'Ce contrat est déjà résilié' };
      }

      await contrat.update({
        statut:            'Résilié',
        date_resiliation:  new Date(),
        motif_resiliation: motif_resiliation || null
      });

      return { success: true, message: 'Contrat résilié avec succès' };

    } catch (error) {
      logger.error('❌ Erreur resilierContrat:', error);
      return { success: false, message: 'Erreur lors de la résiliation' };
    }
  }

  // ============================================================
  // 🔹 SIGNER UN CONTRAT (locataire)
  // POST /:id/signer
  // ============================================================
  static async signerContrat({ contratId, utilisateurConnecte }) {
    try {
      const { Op } = require('sequelize');
      const Utilisateur = require('../../../models/utilisateur.model');

      // Trouver le contrat + vérifier que le user est bien un locataire
      const contrat = await Contrat.findOne({
        where: { id: contratId },
        include: [{
          model:      Utilisateur,
          as:         'locataires',
          attributes: ['id'],
          through:    { attributes: [] },
        }],
      });

      if (!contrat) {
        return { success: false, message: 'Contrat introuvable' };
      }

      // Seul un locataire de ce contrat peut signer
      const estLocataire = contrat.locataires?.some(
        l => l.id === utilisateurConnecte.id
      );

      if (!estLocataire) {
        return { success: false, message: 'Vous n\'êtes pas locataire de ce contrat' };
      }

      if (contrat.statut !== 'en_attente') {
        return {
          success: false,
          error:   contrat.statut === 'signe'
            ? 'Ce contrat est déjà signé'
            : `Ce contrat ne peut pas être signé (statut : ${contrat.statut})`
        };
      }

      await contrat.update({ statut: 'signe' });

      return {
        success: true,
        message: 'Contrat signé avec succès. Le bail est maintenant actif.'
      };

    } catch (error) {
      logger.error('❌ Erreur signerContrat:', error);
      return { success: false, message: 'Erreur lors de la signature du contrat' };
    }
  }

  static async getStats({ utilisateurConnecte }) {
    try {
      const [statsBailleur, statsLocataire] = await Promise.all([
        Contrat.findAll({ where: { bailleurId: utilisateurConnecte.id }, attributes: ['statut'], raw: true }),
        Contrat.findAll({
          include: [{ model: Utilisateur, as: 'locataires', where: { id: utilisateurConnecte.id }, attributes: [], through: { attributes: [] } }],
          attributes: ['statut'],
          raw: true,
        }),
      ]);
      const stats = [...statsBailleur, ...statsLocataire];
      const total = stats.length;
      const signes   = stats.filter(s => s.statut === 'signe').length;
      const enAttente = stats.filter(s => s.statut === 'en_attente').length;
      return { success: true, data: { total, signes, enAttente } };
    } catch (error) {
      return { success: false, message: 'Erreur lors du calcul des statistiques' };
    }
  }
}

// ============================================================
// 🔧 GÉNÉRATION PDF
// ============================================================
async function generatePDFBuffer(html) {
  const htmlToPdf = require('../../../utils/htmlToPdf');
  return htmlToPdf(html);
}

module.exports = GestionContratService;