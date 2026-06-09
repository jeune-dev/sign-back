const { Resend } = require('resend');
// Resend initialisé de façon lazy dans la fonction

async function envoyerEmailConfidentialite({ emailGenerateur, emailAutrePartie, numero_contrat, niveau, pdfBase64 }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Contrat de confidentialité N° ${numero_contrat}`;
    const html = `
      <h2>Contrat de Confidentialité</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint l'<strong>accord de confidentialité</strong>.</p>
      <p><strong>Numéro :</strong> ${numero_contrat}</p>
      <p><strong>Niveau :</strong> ${niveau}</p>
      <p>Merci de bien vouloir le conserver.</p>
      <br/><p>Cordialement,<br/>L'équipe SIGN</p>
    `;
    const attachments = [{ filename: `contrat_confidentialite_${numero_contrat}.pdf`, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }];

    if (emailGenerateur) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailGenerateur, subject, html, attachments });
    if (emailAutrePartie) await resend.emails.send({ from: 'SIGN <onboarding@resend.dev>', to: emailAutrePartie, subject, html, attachments });
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email confidentialité:', error);
    return false;
  }
}

module.exports = envoyerEmailConfidentialite;
