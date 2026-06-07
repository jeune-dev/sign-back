'use strict';

const { Op, literal } = require('sequelize');
const {
  Document,
  Utilisateur,
  ContratTravail,
  ContratPrestation,
  ContratPartenariat,
  ContratLocation,
  ReconnaissanceDette,
  Procuration,
  ContratCaution,
  ContratConfidentialite,
  Contrat,
} = require('../../models');
const sequelize = require('../../config/db');

class ParticulierDashboardService {

  // ============================================================
  // STATS GLOBALES
  // ============================================================
  static async getStats(userId) {
    const [
      facturesTotal,
      facturesSignees,
      // Contrats dont le particulier est l'autre partie ou le salarié
      travailTotal,   travailSigne,
      prestationTotal, prestationSigne,
      partenariatTotal, partenariatSigne,
      locationTotal,   locationSigne,
      detteTotal,      detteSigne,
      procurationTotal, procurationSigne,
      cautionTotal,    cautionSigne,
      confidentialiteTotal, confidentialiteSigne,
      // Bail : locataire via ContratLocataires
      bailTotal,
    ] = await Promise.all([
      Document.count({ where: { clientId: userId } }),
      Document.count({ where: { clientId: userId, document_pdf: { [Op.ne]: null } } }),

      ContratTravail.count({ where: { salarieId: userId } }),
      ContratTravail.count({ where: { salarieId: userId, statut: 'signe' } }),

      ContratPrestation.count({ where: { autrePartieId: userId } }),
      ContratPrestation.count({ where: { autrePartieId: userId, statut: 'signe' } }),

      ContratPartenariat.count({ where: { autrePartieId: userId } }),
      ContratPartenariat.count({ where: { autrePartieId: userId, statut: 'signe' } }),

      ContratLocation.count({ where: { autrePartieId: userId } }),
      ContratLocation.count({ where: { autrePartieId: userId, statut: 'signe' } }),

      ReconnaissanceDette.count({ where: { autrePartieId: userId } }),
      ReconnaissanceDette.count({ where: { autrePartieId: userId, statut: 'signe' } }),

      Procuration.count({ where: { autrePartieId: userId } }),
      Procuration.count({ where: { autrePartieId: userId, statut: 'signe' } }),

      ContratCaution.count({ where: { autrePartieId: userId } }),
      ContratCaution.count({ where: { autrePartieId: userId, statut: 'signe' } }),

      ContratConfidentialite.count({ where: { autrePartieId: userId } }),
      ContratConfidentialite.count({ where: { autrePartieId: userId, statut: 'signe' } }),

      // Bail : via raw query sur ContratLocataires
      sequelize.query(
        'SELECT COUNT(*) as total FROM "ContratLocataires" WHERE "locataireId" = :userId',
        { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
      ).then(r => parseInt(r[0]?.total ?? 0, 10)),
    ]);

    const contratsTotal  = travailTotal + prestationTotal + partenariatTotal + locationTotal + detteTotal + procurationTotal + cautionTotal + confidentialiteTotal + bailTotal;
    const contratsSignes = travailSigne + prestationSigne + partenariatSigne + locationSigne + detteSigne + procurationSigne + cautionSigne + confidentialiteSigne;

    return {
      factures: {
        total:     facturesTotal,
        signees:   facturesSignees,
        enAttente: facturesTotal - facturesSignees,
      },
      contrats: {
        total:     contratsTotal,
        signes:    contratsSignes,
        enAttente: contratsTotal - contratsSignes,
        parType: {
          'contrat-travail':         { total: travailTotal,          signes: travailSigne,          enAttente: travailTotal - travailSigne },
          'contrat-prestation':      { total: prestationTotal,       signes: prestationSigne,       enAttente: prestationTotal - prestationSigne },
          'contrat-partenariat':     { total: partenariatTotal,      signes: partenariatSigne,      enAttente: partenariatTotal - partenariatSigne },
          'contrat-location':        { total: locationTotal,         signes: locationSigne,         enAttente: locationTotal - locationSigne },
          'reconnaissance-dette':    { total: detteTotal,            signes: detteSigne,            enAttente: detteTotal - detteSigne },
          'procuration':             { total: procurationTotal,      signes: procurationSigne,      enAttente: procurationTotal - procurationSigne },
          'contrat-caution':         { total: cautionTotal,          signes: cautionSigne,          enAttente: cautionTotal - cautionSigne },
          'contrat-confidentialite': { total: confidentialiteTotal,  signes: confidentialiteSigne,  enAttente: confidentialiteTotal - confidentialiteSigne },
          'contrat-bail':            { total: bailTotal,             signes: 0,                     enAttente: bailTotal },
        },
      },
    };
  }

  // ============================================================
  // 10 DERNIÈRES FACTURES (signées = avec PDF)
  // ============================================================
  static async getRecentesFactures(userId) {
    const factures = await Document.findAll({
      where: {
        clientId:     userId,
        document_pdf: { [Op.ne]: null },
      },
      include: [
        {
          model:      Utilisateur,
          as:         'professionnel',
          attributes: ['id', 'prenom', 'nom', 'email', 'nom_entreprise', 'telephone'],
        },
      ],
      order:  [['createdAt', 'DESC']],
      limit:  10,
      attributes: ['id', 'numero_facture', 'montant', 'tva', 'moyen_paiement', 'date_execution', 'createdAt'],
    });
    return factures;
  }
}

module.exports = ParticulierDashboardService;
