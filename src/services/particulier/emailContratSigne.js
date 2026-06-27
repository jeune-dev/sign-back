'use strict';

const { Resend } = require('resend');
const logger = require('../../utils/logger');

/**
 * Envoie un email aux deux parties quand le contrat est entièrement signé.
 */
async function envoyerEmailContratSigne({
  emailGenerateur,
  emailDestinataire,
  numero_contrat,
  typeLabel,
  pdfBase64,
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `✅ Contrat signé — ${numero_contrat}`;

    const html = `
      <h2>Contrat entièrement signé</h2>
      <p>Bonjour,</p>
      <p>Le <strong>${typeLabel}</strong> N° <strong>${numero_contrat}</strong>
         a été signé par les deux parties.</p>
      <p>Vous trouverez ci-joint le document final avec les deux signatures.</p>
      <br/>
      <p>Cordialement,<br/>L'équipe SignApp</p>
    `;

    const attachments = [{
      filename:    `contrat_signe_${numero_contrat}.pdf`,
      content:     pdfBase64,
      encoding:    'base64',
      contentType: 'application/pdf',
    }];

    const promises = [];
    if (emailDestinataire) {
      promises.push(resend.emails.send({
        from:        'SignApp <onboarding@resend.dev>',
        to:          emailDestinataire,
        subject,
        html,
        attachments,
      }));
    }
    if (emailGenerateur) {
      promises.push(resend.emails.send({
        from:        'SignApp <onboarding@resend.dev>',
        to:          emailGenerateur,
        subject:     `Copie — ${subject}`,
        html,
        attachments,
      }));
    }

    await Promise.allSettled(promises);
    return true;
  } catch (err) {
    logger.error('[emailContratSigne] Erreur:', err);
    return false;
  }
}

module.exports = envoyerEmailContratSigne;
