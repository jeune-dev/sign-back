const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function formatEmailEtatLogement({
  locataire,
  proprietaire,
  etatLogement,
  pdfBase64
}) {
  try {

    const subject = `État des lieux N° ${etatLogement.numero}`;

    const html = `
      <h2>État des lieux</h2>
      
      <p>Bonjour,</p>
      
      <p>
        Veuillez trouver ci-joint le document relatif à l’
        <strong>état des lieux ${etatLogement.type}</strong>.
      </p>

      <h3>Détails du logement</h3>
      <ul>
        <li><strong>Numéro :</strong> ${etatLogement.numero}</li>
        <li><strong>Adresse :</strong> ${etatLogement.adresse}</li>
        <li><strong>Type :</strong> ${etatLogement.type}</li>
        <li><strong>Date :</strong> ${etatLogement.date}</li>
      </ul>

      <h3>Informations locataire</h3>
      <p>${locataire.nom} ${locataire.prenom}</p>

      <h3>Informations propriétaire</h3>
      <p>${proprietaire.nom} ${proprietaire.prenom}</p>

      <br/>
      <p>Merci de bien vouloir conserver ce document.</p>

      <br/>
      <p>Cordialement,<br/>L'équipe</p>
    `;

    const attachments = [
      {
        filename: `etat_logement_${etatLogement.numero}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ];

    // Envoi au locataire
    if (locataire?.email) {
      await resend.emails.send({
        from: 'État Logement <onboarding@resend.dev>',
        to: locataire.email,
        subject,
        html,
        attachments
      });
    }

    // Envoi au propriétaire
    if (proprietaire?.email) {
      await resend.emails.send({
        from: 'État Logement <onboarding@resend.dev>',
        to: proprietaire.email,
        subject: `Copie - État des lieux N° ${etatLogement.numero}`,
        html,
        attachments
      });
    }

    return true;

  } catch (error) {
    console.error("❌ Erreur envoi état logement :", error);
    return false;
  }
}

module.exports = formatEmailEtatLogement;