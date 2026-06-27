const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.MAIL_FROM || 'SignApp <onboarding@resend.dev>';
const isProd = process.env.NODE_ENV === 'production';
const logger = require('../utils/logger');

/**
 * Envoi générique — utilisé par tous les autres helpers.
 * @param {{ to: string, subject: string, html: string, attachments?: Array }} opts
 */
async function sendEmail({ to, subject, html, attachments = [] }) {
  const formattedAttachments = attachments.map(att => ({
    filename: att.filename,
    content: att.content          // Buffer ou base64 string
  }));

  const payload = {
    from: FROM,
    to,
    subject,
    html,
    ...(formattedAttachments.length > 0 && { attachments: formattedAttachments })
  };

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    logger.error('Resend — erreur envoi email :', error);
    throw new Error(error.message);
  }

  if (isProd) {
    const domain = (Array.isArray(to) ? to[0] : to).split('@')[1] ?? '?';
    logger.info(`[resend] Email envoyé à *@${domain} — ${subject}`);
  } else {
    logger.info(`[resend][dev] Email envoyé à ${to} — ${subject} (id: ${data?.id})`);
  }

  return data;
}

/**
 * Email OTP de réinitialisation de mot de passe
 */
async function sendOtpEmail({ to, nom, otp }) {
  const otpTemplate = require('../templates/mail/otpPassword.template');
  return sendEmail({
    to,
    subject: 'Votre code de réinitialisation SignApp',
    html: otpTemplate({ nom, otp })
  });
}

/**
 * Email de bienvenue à l'inscription
 */
async function sendWelcomeEmail({ to, nom, prenom }) {
  const welcomeTemplate = require('../templates/mail/welcome.template');
  return sendEmail({
    to,
    subject: 'Bienvenue sur SignApp 🎉',
    html: welcomeTemplate({ nom, prenom })
  });
}

/**
 * Envoi document/facture PDF — au client et copie au professionnel
 */
async function sendDocumentEmail({
  emailClient,
  emailProfessionnel,
  numero_facture,
  pdfBase64,
  nomClient = '',
  nomProfessionnel = '',
  nomEntreprise = '',
  type = 'Facture'
}) {
  const templateClient = require('../templates/mail/documentMailTemplateClient');
  const templatePro    = require('../templates/mail/documentMailTemplateProfesionnel');

  // Signature : nomEntreprise si pro, sinon nom complet du professionnel
  const nomSignature = nomEntreprise || nomProfessionnel;

  const attachment = {
    filename: `${type.toLowerCase().replace(/\s+/g, '-')}-${numero_facture}.pdf`,
    content: Buffer.from(pdfBase64, 'base64')
  };

  await Promise.all([
    sendEmail({
      to: emailClient,
      subject: `Votre ${type} ${numero_facture} est disponible`,
      html: templateClient({ nomClient, numeroFacture: numero_facture, nomSignature, type: type.toLowerCase() }),
      attachments: [attachment]
    }),
    sendEmail({
      to: emailProfessionnel,
      subject: `Copie envoyée — ${type} ${numero_facture}`,
      html: templatePro({ nomProfesionnel: nomSignature, numero_facture, type }),
      attachments: [attachment]
    })
  ]);
}

module.exports = { sendEmail, sendOtpEmail, sendWelcomeEmail, sendDocumentEmail };
