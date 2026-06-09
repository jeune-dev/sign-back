const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../../utils/pdfFooter');
const { COLORS, drawHeader, drawSection, drawSignatures, val, today } = require('../../../../utils/pdfDesign');

module.exports = async function procurationTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    attachFooter(doc);

    drawHeader(doc, {
      logo: generateur?.logo,
      titre: 'PROCURATION',
      numero: numero_contrat,
      date: today(),
    });

    drawSection(doc, { titre: 'ENTRE LES SOUSSIGNÉS' });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE MANDANT :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`CNI : ${val(generateur.carte_identite_national_num)} | Email : ${val(generateur.email)} | Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommé « le Mandant »`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark).text('LE MANDATAIRE :');
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);
    doc.text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}`);
    doc.text(`CNI : ${val(autrePartie.carte_identite_national_num)} | Email : ${val(autrePartie.email)} | Tél : ${val(autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Mandataire »`);
    doc.moveDown(1);

    drawSection(doc, {
      titre: 'ARTICLE 1 – OBJET DE LA PROCURATION',
      contenu: `Le Mandant donne pouvoir au Mandataire pour :\n${val(contrat.objet_procuration)}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 2 – POUVOIRS ACCORDÉS',
      contenu: val(contrat.pouvoirs_accordes),
    });

    const type3Content = contrat.type_procuration === 'limitée' && contrat.limites_precises
      ? `Type : PROCURATION LIMITÉE\n\nLimites précises : ${val(contrat.limites_precises)}`
      : `Type : PROCURATION GÉNÉRALE\n\nCelle-ci couvre tous les actes de gestion et d'administration.`;

    drawSection(doc, {
      titre: 'ARTICLE 3 – TYPE DE PROCURATION',
      contenu: type3Content,
    });

    drawSection(doc, {
      titre: 'ARTICLE 4 – DURÉE',
      contenu: `La procuration est valable pour une durée de : ${val(contrat.duree)}`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 5 – RÉVOCATION',
      contenu: `Le Mandant se réserve le droit de révoquer cette procuration à tout moment par notification écrite.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 6 – RESPONSABILITÉ',
      contenu: `Le Mandataire agit au nom du Mandant dans les limites des pouvoirs conférés.`,
    });

    drawSection(doc, {
      titre: 'ARTICLE 7 – EXPIRATION',
      contenu: `La procuration expire automatiquement à l'issue de la durée ou en cas de décès, d'incapacité ou de révocation.`,
    });

    drawSignatures(doc, {
      partie1: 'Le Mandant',
      partie2: 'Le Mandataire',
      dateSignature: today(),
      signature1: generateur?.signature,
    });

    doc.end();
  });
};
