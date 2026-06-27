const { sendEmail } = require('../../../services/resend.service');
const contratEmailTemplate = require('../../../templates/mail/contratEmailTemplate');
const logger = require('../../../utils/logger');

async function envoyerQuittanceLoyerEmail({ emailLocataire, emailBailleur, numero_quittance, mois, annee, montant_total, pdfBase64, nomSignature = 'SIGN' }) {
  try {
    const subject = `Quittance de loyer N° ${numero_quittance}`;
    const attachment = {
      filename: `quittance_loyer_${numero_quittance}.pdf`,
      content: Buffer.from(pdfBase64, 'base64')
    };

    const html = contratEmailTemplate({
      typeDocument: 'Quittance de loyer',
      numero: numero_quittance,
      details: [
        { label: 'Numéro', value: numero_quittance },
        { label: 'Période', value: `${mois} ${annee}` },
        { label: 'Montant total payé', value: `${Number(montant_total).toLocaleString('fr-FR')} FCFA` }
      ],
      nomSignature,
      messageExtra: "Ce document confirme la bonne réception du paiement du loyer pour la période indiquée."
    });

    const envois = [];
    if (emailLocataire) envois.push(sendEmail({ to: emailLocataire, subject, html, attachments: [attachment] }));
    if (emailBailleur) envois.push(sendEmail({ to: emailBailleur, subject: `Copie — Quittance de loyer N° ${numero_quittance}`, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    logger.error('Erreur envoi quittance loyer:', error);
    return false;
  }
}

module.exports = envoyerQuittanceLoyerEmail;
