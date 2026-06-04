const PDFDocument = require('pdfkit');

module.exports = async function contratCautionTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('CONTRAT DE CAUTION', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`N° ${numero_contrat}  |  Date : ${today}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :');
    doc.moveDown(0.5);

    const creancier = contrat.info_creancier || {};
    const debiteur = contrat.info_debiteur || {};
    const cautionInfo = contrat.info_caution || {};

    doc.font('Helvetica-Bold').text('LE CRÉANCIER :');
    doc.font('Helvetica').text(`${val(creancier.nom || autrePartie.nom)} ${val(creancier.prenom || autrePartie.prenom)}`);
    doc.text(`Email : ${val(creancier.email || autrePartie.email)}  |  Tél : ${val(creancier.telephone || autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Créancier »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('LE DÉBITEUR :');
    doc.font('Helvetica').text(`${val(debiteur.nom)}  |  Email : ${val(debiteur.email)}`);
    doc.text(`Ci-après dénommé « le Débiteur »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('LA CAUTION :');
    doc.font('Helvetica').text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`Email : ${val(generateur.email)}  |  Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommée « la Caution »`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text(`ARTICLE 1 – ENGAGEMENT DE CAUTION ${val(contrat.type_caution).toUpperCase()}`);
    doc.font('Helvetica').text(`La Caution se porte garante des obligations du Débiteur envers le Créancier à hauteur de :`);
    doc.moveDown(0.3);
    doc.fontSize(13).font('Helvetica-Bold').text(`${val(contrat.montant_garanti)} FCFA`, { align: 'center' });
    doc.fontSize(11).font('Helvetica').moveDown(0.5);

    if (contrat.type_caution === 'solidaire') {
      doc.text(`Il s'agit d'une caution SOLIDAIRE : le Créancier peut se retourner directement contre la Caution sans avoir à poursuivre préalablement le Débiteur.`);
    } else {
      doc.text(`Il s'agit d'une caution SIMPLE : le Créancier doit d'abord poursuivre le Débiteur avant de se retourner contre la Caution (bénéfice de discussion).`);
    }
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 2 – CONDITIONS ET DURÉE');
    doc.font('Helvetica').text(`Durée de la garantie : ${val(contrat.duree)}`);
    doc.text(`La présente caution prend effet à compter de la signature du présent acte.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 3 – RÉSILIATION');
    doc.font('Helvetica').text(`La présente caution prend fin à l'échéance de la durée prévue ou dès que le Débiteur a intégralement rempli ses obligations envers le Créancier.`);
    doc.moveDown(1.5);

    doc.font('Helvetica').text(`Fait à ${val(contrat.ville_signature)}, le ${today}`);
    doc.moveDown(2);
    doc.text('La Caution                                Le Créancier');
    doc.moveDown(3);
    doc.text('Signature :                               Signature :');

    doc.end();
  });
};
