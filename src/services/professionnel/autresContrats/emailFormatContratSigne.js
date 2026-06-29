const { sendEmail } = require('../../../services/resend.service');
const contratEmailTemplate = require('../../../templates/mail/contratEmailTemplate');
const logger = require('../../../utils/logger');

/**
 * Envoie l'email "contrat signé" aux deux parties après signature.
 *
 * @param {Object} opts
 * @param {string} opts.emailGenerateur
 * @param {string} opts.emailAutrePartie    - email du signataire (autrePartie ou salarié)
 * @param {string} opts.numero_contrat
 * @param {string} opts.typeDocument        - ex. "Contrat de caution"
 * @param {Array}  opts.details             - [{ label, value }]
 * @param {string} opts.pdfBase64           - Buffer PDF encodé en base64
 * @param {string} [opts.nomSignature]
 */
async function envoyerEmailContratSigne({
  emailGenerateur,
  emailAutrePartie,
  numero_contrat,
  typeDocument,
  details = [],
  pdfBase64,
  nomSignature = 'SIGN',
}) {
  try {
    const subject = `✅ Contrat signé — ${numero_contrat}`;
    const filename = `${numero_contrat.toLowerCase().replace(/[^a-z0-9]/g, '_')}_signe.pdf`;
    const attachment = {
      filename,
      content: Buffer.from(pdfBase64, 'base64'),
    };

    const html = contratEmailTemplate({
      typeDocument,
      numero: numero_contrat,
      details: [
        ...details,
        { label: 'Date de signature', value: new Date().toLocaleDateString('fr-FR') },
      ],
      nomSignature,
      messageExtra:
        '✅ Ce contrat a été <strong>signé par les deux parties</strong> et est maintenant en vigueur. ' +
        'Vous trouverez le document final signé en pièce jointe.',
    });

    const envois = [];
    if (emailGenerateur)  envois.push(sendEmail({ to: emailGenerateur,  subject, html, attachments: [attachment] }));
    if (emailAutrePartie) envois.push(sendEmail({ to: emailAutrePartie, subject, html, attachments: [attachment] }));

    await Promise.all(envois);
    return true;
  } catch (error) {
    logger.error('❌ Erreur envoi email contrat signé:', error);
    return false;
  }
}

module.exports = envoyerEmailContratSigne;
