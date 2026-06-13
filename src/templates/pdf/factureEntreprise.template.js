module.exports = function invoiceTemplate(data) {

  const {
    numeroFacture,
    nomClient,
    cniClient,
    nomUtilisateur,
    telephone,
    email,
    logo,
    rc,
    ninea,
    delais_execution,
    date_execution,
    avance = 0,
    montant_paye = 0,
    lieu_execution,
    montant,
    moyen_paiement,
    items,
    dateGeneration,
    signature,
    nomEntreprise,
    adresseEntreprise,
    telephoneEntreprise,
    emailEntreprise,
    tva
  } = data;

  const paiementRecu = Number(montant_paye) > 0 ? Number(montant_paye) : Number(avance);

  const TVA_RATE = (Number(tva) || 0) / 100;
  const totalHT = Number(montant) || 0;
  const tvaAmount = totalHT * TVA_RATE;
  const totalTTC = totalHT + tvaAmount;
  const totalAPayer = totalTTC - paiementRecu;

  const format = n => Math.round(Number(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const today = new Date().toLocaleDateString('fr-FR');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

<style>
@page { size: A4; margin: 0; }

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', Arial, sans-serif;
  color: #111;
  font-size: 12.5px;
  background: #fff;
  line-height: 1.6;
}

/* ── RESET TABLES ── */
table { border-collapse: collapse; }
td, th { padding: 0; vertical-align: top; }

/* ── TYPOGRAPHY ── */
.title-word {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 52px;
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1;
  text-transform: uppercase;
  color: #111;
  text-align: center;
}

.title-underline {
  width: 60px;
  height: 2px;
  background: #111;
  margin: 8px auto 0;
}

.info-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 6px;
}

/* ── DIVIDERS ── */
.hr-light { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
.hr-thick { border: none; border-top: 2px solid #111; margin: 20px 0; }

/* ── SECTION TAG ── */
.section-tag {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  background: #111;
  padding: 4px 12px;
  margin-bottom: 10px;
}

/* ── META BADGE ── */
.meta-cell {
  border: 1px solid #ddd;
  background: #fafafa;
  padding: 7px 12px;
}
.meta-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #888;
  white-space: nowrap;
  padding-right: 14px;
}
.meta-val {
  font-size: 12px;
  font-weight: 500;
  color: #111;
  text-align: right;
}

/* ── ITEMS TABLE ── */
.items-table { width: 100%; margin-top: 18px; }

.items-table thead tr { background: #111; }
.items-table thead th {
  padding: 11px 14px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #fff;
  border: none;
  text-align: left;
}
.items-table thead th.right { text-align: right; }

.items-table tbody td {
  padding: 11px 14px;
  font-size: 12.5px;
  color: #222;
  border-bottom: 1px solid #e8e8e8;
}
.items-table tbody tr:last-child td { border-bottom: 2px solid #111; }
.items-table tbody tr:nth-child(even) td { background: #f8f8f8; }
.items-table tbody td.right { text-align: right; }

/* ── TOTALS TABLE ── */
.totals-table { width: 48%; margin-left: auto; margin-top: 18px; border: 1px solid #ddd; }

.totals-table td {
  padding: 9px 16px;
  font-size: 12.5px;
  border-bottom: 1px solid #e8e8e8;
  vertical-align: middle;
}
.totals-table tr:last-child td { border-bottom: none; }
.totals-table .amount { text-align: right; }

.row-ttc td { background: #f0f0f0; font-weight: 600; font-size: 13px; }
.row-sep td { padding: 0 !important; height: 0 !important; line-height: 0; border-top: 1.5px solid #111 !important; border-bottom: none !important; }
.row-reste td {
  background: #111;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  border-bottom: none;
  padding: 11px 16px;
}

/* ── PAYMENT ── */
.payment-wrap { margin-top: 16px; }
.payment-table { border: 1.5px solid #111; }
.payment-table td { vertical-align: middle; }
.pay-label {
  background: #111;
  color: #fff;
  padding: 8px 16px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  white-space: nowrap;
}
.pay-val {
  padding: 8px 18px;
  font-size: 12.5px;
  font-weight: 500;
  color: #111;
  white-space: nowrap;
}

/* ── SIGNATURE ── */
.sig-line {
  width: 150px;
  height: 65px;
  border-bottom: 1.5px solid #333;
  display: block;
  margin-left: auto;
  margin-bottom: 8px;
}
.sig-label {
  font-size: 9.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  font-weight: 600;
  text-align: right;
  padding-top: 5px;
}

/* ── FOOTER LÉGAL ── */
.page-footer {
  margin-top: 36px;
  padding-top: 10px;
  border-top: 0.5px solid #D4D4D4;
}
.page-footer-inner {
  display: table;
  width: 100%;
  table-layout: fixed;
}
.footer-badge {
  display: table-cell;
  width: 34px;
  vertical-align: middle;
  padding-right: 10px;
}
.footer-badge-box {
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 6px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-align: center;
  padding: 3px 5px;
  border-radius: 3px;
  white-space: nowrap;
}
.footer-text {
  display: table-cell;
  vertical-align: middle;
  font-size: 6px;
  color: #9A9A9A;
  line-height: 1.55;
  text-align: justify;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.02em;
}
</style>
</head>
<body>

<!-- ══ HEADER ══════════════════════════════════════════ -->
<table width="100%" style="border-bottom: 3px solid #111; padding-bottom: 20px;">
  <tr>
    ${logo
      ? `<td width="120" valign="middle"><img src="${logo}" style="width:110px; height:72px; object-fit:contain; border:1.5px solid #111; display:block;" /></td>`
      : `<td width="120"></td>`
    }
    <td valign="middle" align="center">
      <div class="title-word">Facture</div>
      <div class="title-underline"></div>
    </td>
    <td width="120"></td>
  </tr>
</table>

<!-- ══ ÉMETTEUR / ENTREPRISE ═══════════════════════════ -->
<hr class="hr-light">
<table width="100%">
  <tr>
    <td width="50%" valign="top" style="padding-right: 24px;">
      <div class="info-label">Émetteur</div>
      <strong style="font-size:13.5px;">${nomUtilisateur}</strong><br>
      ${telephone || ''}<br>
      ${email || ''}
    </td>
    <td width="50%" valign="top" align="right" style="padding-left: 24px;">
      <div class="info-label">Entreprise</div>
      <strong style="font-size:13.5px;">${nomEntreprise || '-'}</strong><br>
      ${adresseEntreprise || ''}<br>
      ${telephoneEntreprise || ''}<br>
      ${emailEntreprise || ''}<br>
      RC&nbsp;: ${rc || '-'} &nbsp;·&nbsp; NINEA&nbsp;: ${ninea || '-'}
    </td>
  </tr>
</table>
<hr class="hr-thick">

<!-- ══ CLIENT & META ════════════════════════════════════ -->
<table width="100%">
  <tr>
    <td width="44%" valign="top" style="padding-right: 20px;">
      <div class="section-tag">Client</div><br>
      <strong style="font-size:13.5px;">${nomClient}</strong><br>
      CNI&nbsp;: ${cniClient || '-'}
    </td>
    <td width="56%" valign="top">
      <table width="100%">
        <tr>
          <td style="padding: 0 0 6px 6px;">
            <table width="100%" class="meta-cell">
              <tr>
                <td class="meta-label">N° Facture</td>
                <td class="meta-val" style="white-space:nowrap;">${numeroFacture} &nbsp;·&nbsp; <span style="font-size:10px;color:#888;">${dateGeneration}</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 6px 6px;">
            <table width="100%" class="meta-cell">
              <tr>
                <td class="meta-label">Délai</td>
                <td class="meta-val">${delais_execution}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 0 6px;">
            <table width="100%" class="meta-cell">
              <tr>
                <td class="meta-label">Date exécution</td>
                <td class="meta-val">${date_execution}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ══ TABLE PRODUITS ═══════════════════════════════════ -->
<table class="items-table">
  <thead>
    <tr>
      <th>Désignation</th>
      <th class="right" width="60">Qté</th>
      <th class="right" width="145">Prix Unitaire</th>
      <th class="right" width="145">Total</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(i => `
    <tr>
      <td>${i.designation}</td>
      <td class="right">${i.quantite}</td>
      <td class="right">${format(i.prix_unitaire)} FCFA</td>
      <td class="right">${format(i.quantite * i.prix_unitaire)} FCFA</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<!-- ══ TOTAUX ═══════════════════════════════════════════ -->
<table class="totals-table">
  <tr>
    <td>Total HT</td>
    <td class="amount">${format(totalHT)} FCFA</td>
  </tr>
  <tr>
    <td>TVA (${TVA_RATE * 100}%)</td>
    <td class="amount">${format(tvaAmount)} FCFA</td>
  </tr>
  <tr class="row-ttc">
    <td>Total TTC</td>
    <td class="amount">${format(totalTTC)} FCFA</td>
  </tr>
  <tr class="row-sep"><td colspan="2"></td></tr>
  <tr>
    <td>${Number(montant_paye) > 0 ? 'Montant payé' : 'Avance versée'}</td>
    <td class="amount">${format(paiementRecu)} FCFA</td>
  </tr>
  <tr class="row-reste">
    <td>Reste à payer</td>
    <td class="amount">${format(totalAPayer)} FCFA</td>
  </tr>
</table>

<!-- ══ MODE DE PAIEMENT ═════════════════════════════════ -->
<div class="payment-wrap">
  <table class="payment-table">
    <tr>
      <td class="pay-label">Mode de paiement</td>
      <td class="pay-val">${moyen_paiement}</td>
    </tr>
  </table>
</div>

<!-- ══ BAS DE PAGE ══════════════════════════════════════ -->
<table width="100%" style="margin-top: 36px;">
  <tr>
    <td valign="bottom">
      <div style="font-size:12px; color:#444; line-height:2.4;">
        <span style="font-weight:600; color:#111;">Lieu :</span> ${lieu_execution || '-'}<br>
        <span style="font-weight:600; color:#111;">Date :</span> ${today}
      </div>
    </td>
    <td valign="bottom" align="right">
      <div class="sig-label">SIGNATURE</div>
      ${signature
        ? `<img src="${signature}" style="max-width:150px; max-height:75px; display:block; margin-left:auto; margin-top:8px;" />`
        : `<div class="sig-line"></div>`
      }
    </td>
  </tr>
</table>

<!-- ══ FOOTER LÉGAL ══════════════════════════════════════ -->
<div class="page-footer">
  <div class="page-footer-inner">
    <div class="footer-badge">
      <div class="footer-badge-box">SIGN</div>
    </div>
    <div class="footer-text">
      Document généré, signé électroniquement et archivé par Sign.
      Les informations qu'il contient sont réputées exactes à la date de signature.
      Conformément à la réglementation applicable en matière de preuve électronique au Sénégal,
      ce document, ainsi que ses données d'authentification et d'horodatage,
      peut être produit devant toute autorité compétente à titre de preuve des engagements constatés.
      Toute modification non autorisée du présent document est interdite.
    </div>
  </div>
</div>

</body>
</html>
`;
};