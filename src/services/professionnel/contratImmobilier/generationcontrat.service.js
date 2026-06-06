const { Contrat, Utilisateur } = require('../../../models');
const paginate = require('../../../utils/paginate');
const sequelize         = require('../../../config/db');
const { Op }            = require('sequelize');

const contratBailTemplate = require('../../../templates/pdf/contratBail/contratBail.template');
const envoyerContratEmail = require('./emailFormatContratBail');

class GestionContratService {

  // ============================================================
  // 🔹 GÉNÉRER NUMÉRO DE CONTRAT
  // ============================================================
  static async genererNumeroContrat() {
    try {
      const annee = new Date().getFullYear();

      const dernierContrat = await Contrat.findOne({
        where:      { numero_contrat: { [Op.like]: `CONTRAT-${annee}-%` } },
        order:      [['createdAt', 'DESC']],
        attributes: ['numero_contrat']
      });

      let compteur = 1;
      if (dernierContrat?.numero_contrat) {
        const parts = dernierContrat.numero_contrat.split('-');
        compteur    = parseInt(parts[2], 10) + 1 || 1;
      }

      return `CONTRAT-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      console.error('❌ Erreur genererNumeroContrat:', error);
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
}) {
  const transaction = await sequelize.transaction();

  try {

    // ── 1. Récupérer le bailleur complet ────────────────────
    const bailleur = await Utilisateur.findByPk(utilisateurConnecte.id);
    if (!bailleur) {
      await transaction.rollback();
      return { success: false, error: 'Bailleur introuvable' };
    }

    // ── 2. Récupérer les locataires ─────────────────────────
    if (!Array.isArray(locatairesIds) || locatairesIds.length === 0) {
      await transaction.rollback();
      return { success: false, error: 'Au moins un locataire est requis' };
    }

    const locataires = await Utilisateur.findAll({
      where: { id: { [Op.in]: locatairesIds } }
    });

    if (locataires.length !== locatairesIds.length) {
      await transaction.rollback();
      return { success: false, error: 'Un ou plusieurs locataires sont introuvables' };
    }

    // ── 3. Validations métier ───────────────────────────────
    if (!paiement?.montant_loyer || Number(paiement.montant_loyer) <= 0) {
      await transaction.rollback();
      return { success: false, error: 'Le montant du loyer est invalide' };
    }

    if (!bail?.date_debut) {
      await transaction.rollback();
      return { success: false, error: 'La date de début du bail est requise' };
    }

    if (!bien?.adresse || !bien?.type || !bien?.usage) {
      await transaction.rollback();
      return { success: false, error: 'Les informations sur le bien sont incomplètes' };
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

      statut:      'Actif',
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
        signature:         bailleur.signature             || null, // ← signature base64
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

    // ── 8. Stocker le PDF en base64 ─────────────────────────
    const pdfBase64 = pdfBuffer.toString('base64');

    await Contrat.update(
      { contrat_pdf: pdfBase64 },
      { where: { id: contrat.id } }
    );

    // ── 9. Envoi des emails ─────────────────────────────────
    console.log('📧 Envoi des emails avec les informations suivantes :');
    console.log({
      emailsLocataires: locataires.map(l => l.email),
      emailBailleur:    bailleur.email,
      numero_contrat,
      pdfBase64:        pdfBase64 ? '[PDF généré]' : '[Aucun fichier]',
    });

    try {
      await envoyerContratEmail({
        emailsLocataires: locataires.map(l => l.email),
        emailBailleur:    bailleur.email,
        numero_contrat,
        pdfBase64,        // ← le PDF en base64 — à attacher en pièce jointe .pdf
      });
      console.log('✅ Emails envoyés avec succès');
    } catch (err) {
      console.error('❌ Erreur lors de l\'envoi des emails :', err);
    }

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
    console.error('❌ Erreur creerContrat:', error);
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
      return { success: false, error: 'Erreur lors de la récupération des contrats' };
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
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse']
          },
          {
            model:      Utilisateur,
            as:         'locataires',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse'],
            through:    { attributes: [] }
          }
        ]
      });

      if (!contrat) {
        return { success: false, error: 'Contrat introuvable ou accès non autorisé' };
      }

      return { success: true, data: contrat };

    } catch (error) {
      console.error('❌ Erreur getContratById:', error);
      return { success: false, error: 'Erreur lors de la récupération du contrat' };
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
        return { success: false, error: 'Contrat introuvable ou accès non autorisé' };
      }

      if (!contrat.contrat_pdf) {
        return { success: false, error: 'Aucun PDF disponible pour ce contrat' };
      }

      const pdfBuffer = Buffer.from(contrat.contrat_pdf, 'base64');

      return {
        success: true,
        data: { pdfBuffer, numero_contrat: contrat.numero_contrat }
      };

    } catch (error) {
      console.error('❌ Erreur telechargerContrat:', error);
      return { success: false, error: 'Erreur lors du téléchargement du contrat' };
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
        return { success: false, error: 'Contrat introuvable ou accès non autorisé' };
      }

      if (contrat.statut === 'Résilié') {
        return { success: false, error: 'Ce contrat est déjà résilié' };
      }

      await contrat.update({
        statut:            'Résilié',
        date_resiliation:  new Date(),
        motif_resiliation: motif_resiliation || null
      });

      return { success: true, message: 'Contrat résilié avec succès' };

    } catch (error) {
      console.error('❌ Erreur resilierContrat:', error);
      return { success: false, error: 'Erreur lors de la résiliation' };
    }
  }
}

// ============================================================
// 🔧 GÉNÉRATION PDF
// ============================================================
async function generatePDFBuffer(html) {
  const pdf = require('html-pdf');

  return new Promise((resolve, reject) => {
    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}

module.exports = GestionContratService;