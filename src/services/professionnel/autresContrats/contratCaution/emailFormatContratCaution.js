const { Resend } = require('resend');
// Resend initialisé de façon lazy dans la fonction

async function envoyerEmailCaution({ emailGenerateur, emailAutrePartie, numero_contrat, montant, pdfBase64 }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Contrat de caution N° ${numero_contrat}`;
    const html = `
      <h2>Contrat de caution</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint le <strong>contrat de caution</strong>.</p>
      <p><strong>Numéro :</strong> ${numero_contrat}</p>
      <p><strong>Montant garanti :</strong> ${montant} FCFA</p>
      <p>Merci de bien vouloir le conserver.</p>
      <br/><p>Cordialement,<br/>L'équipe SIGN</p>
    `;
    const attachments = [{ filename: `contrat_caution_${numero_contrat}.pdf`, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }];

    if (emailGenerateur) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailGenerateur, subject, html, attachments });
    if (emailAutrePartie) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailAutrePartie, subject, html, attachments });
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email caution:', error);
    return false;
  }
}

module.exports = envoyerEmailCaution;
