const { Resend } = require('resend');
// Resend initialisé de façon lazy dans la fonction

async function envoyerEmailProcuration({ emailMandant, emailMandataire, numero_contrat, objet, pdfBase64 }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Procuration N° ${numero_contrat}`;
    const html = `
      <h2>Procuration</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint la <strong>procuration</strong>.</p>
      <p><strong>Numéro :</strong> ${numero_contrat}</p>
      <p><strong>Objet :</strong> ${objet}</p>
      <p>Merci de bien vouloir le conserver.</p>
      <br/><p>Cordialement,<br/>L'équipe SIGN</p>
    `;
    const attachments = [{ filename: `procuration_${numero_contrat}.pdf`, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }];

    if (emailMandant) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailMandant, subject, html, attachments });
    if (emailMandataire) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailMandataire, subject, html, attachments });
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email procuration:', error);
    return false;
  }
}

module.exports = envoyerEmailProcuration;
