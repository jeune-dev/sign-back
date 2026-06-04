const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerEmailLocation({ emailGenerateur, emailAutrePartie, numero_contrat, type_bien, pdfBase64 }) {
  try {
    const subject = `Contrat de location N° ${numero_contrat}`;
    const html = `
      <h2>Contrat de location de bien</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint votre <strong>contrat de location</strong>.</p>
      <p><strong>Numéro :</strong> ${numero_contrat}</p>
      <p><strong>Type de bien :</strong> ${type_bien}</p>
      <p>Merci de bien vouloir le conserver.</p>
      <br/><p>Cordialement,<br/>L'équipe SIGN</p>
    `;
    const attachments = [{ filename: `contrat_location_${numero_contrat}.pdf`, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }];

    if (emailGenerateur) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailGenerateur, subject, html, attachments });
    if (emailAutrePartie) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailAutrePartie, subject, html, attachments });
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email location:', error);
    return false;
  }
}

module.exports = envoyerEmailLocation;
