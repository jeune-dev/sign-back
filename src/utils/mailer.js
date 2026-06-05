const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const isProd = process.env.NODE_ENV === 'production';

exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const formattedAttachments = attachments.map(att => ({
    name: att.filename,
    content: att.content.toString('base64')
  }));

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
    to: [{ email: to }],
    sender: {
      name: 'Support',
      email: process.env.MAIL_FROM || 'beyeballa04@gmail.com'
    },
    subject,
    htmlContent: html,
    attachment: formattedAttachments
  });

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);

    if (isProd) {
      const domain = to.split('@')[1] ?? '?';
      console.log(`Email envoyé à *@${domain} — sujet : ${subject}`);
    } else {
      console.log(`[dev] Email envoyé à ${to} — sujet : ${subject}`);
    }
  } catch (error) {
    console.error('Erreur envoi email :', error.response?.status ?? error.message);
    throw error;
  }
};
