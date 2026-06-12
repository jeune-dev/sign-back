const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../../utils/pdfFooter');
const { COLORS, drawHeader, drawSection, drawSignatures, resolveImageBuffer, val, today } = require('../../../../utils/pdfDesign');

module.exports = async function contratLocationTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const [logoBuffer, signatureBuffer1, signatureBuffer2] = await Promise.all([
    resolveImageBuffer(generateur?.logo),
    resolveImageBuffer(generateur?.signature),
    resolveImageBuffer(autrePartie?.signature),
  ]);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    attachFooter(doc);

    drawHeader(doc, {
      logoBuffer,
      titre: 'CONTRAT DE LOCATION DE BIEN MOBILIER',
      numero: numero_contrat,
      date: today(),
    });

    drawSection(doc, { titre: 'ENTRE LES SOUSSIGNÉS' });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE PROPRIÉTAIRE :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(generateur.nom)} ${val(generateur.prenom)} | Email : ${val(generateur.email)} | Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommé « le Propriétaire »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE LOCATAIRE :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)} | Email : ${val(autrePartie.email)} | Tél : ${val(autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Locataire »`);
    doc.moveDown(1);

    drawSection(doc, {
      titre: 'ARTICLE 1 – DESCRIPTION DU BIEN',
      contenu: `Type : ${val(contrat.type_bien)}\n\nDescription : ${val(contrat.description_bien)}\n\nÉtat : ${val(contrat.etat_bien)}\n\nValeur estimée : ${val(contrat.valeur_estimee)} FCFA`,
    });

    const cautionLine = contrat.caution ? `\n\nCaution : ${val(contrat.montant_caution)} FCFA` : '';
    drawSection(doc, {
      titre: 'ARTICLE 2 – CONDITIONS DE LOCATION',
      contenu: `Durée : ${val(contrat.duree_location)}\n\nMontant mensuel : ${val(contrat.montant_location)} FCFA${cautionLine}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 3 – ENTRETIEN DU BIEN',
      contenu: `Le Locataire s'engage à utiliser le bien avec soin et à en assurer l'entretien courant.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 4 – RESTITUTION DU BIEN',
      contenu: `Le bien devra être restitué dans l'état reçu, sous réserve de l'usure normale.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 5 – RESPONSABILITÉ',
      contenu: `Le Locataire est responsable de tout dommage au bien, sauf cas de force majeure.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 6 – DOMMAGES',
      contenu: `Les frais de remise en état en cas de dommages seront à la charge du Locataire.`,
    });

    drawSignatures(doc, {
      partie1: 'Le Propriétaire',
      partie2: 'Le Locataire',
      dateSignature: today(),
      signatureBuffer1,
      signatureBuffer2,
    });

    doc.end();
  });
};
