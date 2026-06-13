module.exports = ({ nomProfesionnel, numero_facture, type = 'Facture' }) => {
  const isFacture = type.toLowerCase().includes('facture');
  const copieMsg = isFacture
    ? "Une copie a également été envoyée directement au client pour qu'il puisse la consulter et effectuer le règlement."
    : "Une copie a également été transmise au client afin qu'il puisse consulter et signer le document.";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.07);overflow:hidden;">

          <!-- Header noir -->
          <tr>
            <td style="background:#111111;padding:28px 36px;">
              <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">SIGN</p>
              <p style="margin:4px 0 0;font-size:11px;color:#888888;letter-spacing:2px;text-transform:uppercase;">Gestion & Signature électronique</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:36px 36px 28px;color:#1e293b;font-size:15px;line-height:1.7;">

              <p style="margin:0 0 16px;">Bonjour <strong>${nomProfesionnel}</strong>,</p>

              <p style="margin:0 0 16px;">
                Votre <strong>${type}</strong>
                <span style="color:#111111;font-weight:bold;">${numero_facture}</span>
                a été générée avec succès et envoyée à votre client.
              </p>

              <!-- Encart -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#f8fafc;border-left:4px solid #111111;padding:16px 20px;border-radius:4px;">
                    <p style="margin:0;font-size:14px;color:#475569;">
                      📎 Le document PDF est joint à cet email pour votre archivage.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;">${copieMsg}</p>

              <!-- Séparateur -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 20px;">
                <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;">
                Cordialement,<br/>
                <strong style="color:#111111;font-size:15px;">L'équipe SIGN</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:18px 36px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                © ${new Date().getFullYear()} SIGN — Tous droits réservés ·
                Ce message est confidentiel et destiné uniquement à son destinataire.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`};
