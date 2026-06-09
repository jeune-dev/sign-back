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
    lieu_execution,
    montant,
    moyen_paiement,
    items,
    dateGeneration,
    signature
  } = data;

  const TVA_RATE = 0.18;
  const totalHT = Number(montant) || 0;
  const tvaAmount = totalHT * TVA_RATE;
  const totalTTC = totalHT + tvaAmount;
  const totalAPayer = totalTTC - Number(avance);

  const format = n => Number(n || 0).toLocaleString('fr-FR');

  const today = new Date().toLocaleDateString('fr-FR');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">

<style>
@page { size:A4; margin:18mm; }

body{
  font-family:Arial, Helvetica, sans-serif;
  color:#111;
  font-size:13px;
}

.title{
  text-align:center;
  font-size:42px;
  font-weight:bold;
}

.logo{
  width:120px;
  height:80px;
  border:1px solid #000;
  display:flex;
  align-items:center;
  justify-content:center;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:12px;
}

th,td{
  border:1px solid #333;
  padding:8px;
}

th{
  background:#f2f2f2;
}

.totals{
  width:50%;
  margin-left:auto;
  margin-top:12px;
}

.totals div{
  display:flex;
  justify-content:space-between;
  padding:6px 10px;
  border:1px solid #333;
  border-top:none;
}

.totals div:first-child{
  border-top:1px solid #333;
}

.lieu-date{
  display:flex;
  justify-content:space-between;
  margin-top:30px;
}

.signature-block{
  text-align:right;
  margin-top:40px;
}

.signature-img{
  max-width:150px;
  max-height:80px;
}

.footer {
  margin-top: 36px;
  padding-top: 10px;
  border-top: 0.5px solid #D4D4D4;
}
.footer-inner {
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

<!-- HEADER -->
<div style="display:flex;justify-content:space-between;">
  <div class="logo">
    ${logo ? `<img src="${logo}" style="max-width:100%;max-height:100%;" />` : 'LOGO'}
  </div>
  <div class="title">Facture</div>
  <div style="width:120px;"></div>
</div>

<hr>

<!-- ENTREPRISE -->
<div style="display:flex;justify-content:space-between;">
  <div>
    <strong>${nomUtilisateur}</strong><br>
    ${telephone || ''}<br>
    ${email || ''}
  </div>
  <div style="text-align:right">
    RC : ${rc || '-'}<br>
    NINEA : ${ninea || '-'}
  </div>
</div>

<hr>

<!-- CLIENT & META -->
<div style="display:flex;justify-content:space-between;">
  <div>
    <strong>CLIENT</strong><br>
    ${nomClient}<br>
    CNI : ${cniClient || '-'}
  </div>

  <div style="text-align:right">
    Facture N° : ${numeroFacture}<br>
    Date : ${dateGeneration}<br>
    Délai : ${delais_execution}<br>
    Date exécution : ${date_execution}
  </div>
</div>

<!-- TABLE PRODUITS -->
<table>
<thead>
<tr>
<th>Désignation</th>
<th>Qté</th>
<th>Prix Unitaire</th>
<th>Total</th>
</tr>
</thead>
<tbody>
${items.map(i => `
<tr>
<td>${i.designation}</td>
<td align="center">${i.quantite}</td>
<td align="right">${format(i.prix_unitaire)} FCFA</td>
<td align="right">${format(i.quantite * i.prix_unitaire)} FCFA</td>
</tr>
`).join('')}
</tbody>
</table>

<!-- TOTALS -->
<div class="totals">
  <div><span>Total HT: </span><span>${format(totalHT)} FCFA</span></div>
  <div><span>TVA (${TVA_RATE * 100}%): </span><span>${format(tvaAmount)} FCFA</span></div>
  <div><strong>Total TTC: </strong><strong>${format(totalTTC)} FCFA</strong></div>
</div>

<div class="totals">
  <div><span>Avance: </span><span>${format(avance)} FCFA</span></div>
  <div><strong>Reste à payer: </strong><strong>${format(totalAPayer)} FCFA</strong></div>
</div>

<br>
<table style="width:300px; margin-top:12px; border-collapse: collapse;">
  <tr>
    <td style="font-weight:bold; padding:6px 8px; border:1px solid #333;">Mode de paiement</td>
    <td style="padding:6px 8px; border:1px solid #333;">${moyen_paiement}</td>
  </tr>
</table>

<!-- LIEU & DATE ALIGNÉS -->
<div class="lieu-date">
  <div>
    <strong>Lieu :</strong> ${lieu_execution || '-'}
  </div>
  <div style="text-align:right">
    <strong>Date :</strong> ${today}
  </div>
</div>

<!-- SIGNATURE -->
<div class="signature-block">
  ${signature 
    ? `<img src="${signature}" class="signature-img" />` 
    : `<div style="height:60px;"></div>`
  }
  <div style="margin-top:8px;">Cachet & Signature</div>
</div>

<!-- ══ FOOTER LÉGAL ══════════════════════════════════════ -->
<div class="footer">
  <div class="footer-inner">
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