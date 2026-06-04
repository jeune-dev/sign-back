const PDFDocument = require('pdfkit');

module.exports = async function procurationTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('PROCURATION', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`N° ${numero_contrat}  |  Date : ${today}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :');
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('LE MANDANT :');
    doc.font('Helvetica').text(`${val(generateur.nom)} ${val(generateur.prenom)}`);
    doc.text(`CNI : ${val(generateur.carte_identite_national_num)}  |  Email : ${val(generateur.email)}  |  Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommé « le Mandant »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('LE MANDATAIRE :');
    doc.font('Helvetica').text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}`);
    doc.text(`CNI : ${val(autrePartie.carte_identite_national_num)}  |  Email : ${val(autrePartie.email)}  |  Tél : ${val(autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Mandataire »`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('ARTICLE 1 – OBJET DE LA PROCURATION');
    doc.font('Helvetica').text(`Par la présente, le Mandant donne pouvoir au Mandataire pour :`);
    doc.text(val(contrat.objet_procuration), { indent: 20 });
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 2 – POUVOIRS ACCORDÉS');
    doc.font('Helvetica').text(val(contrat.pouvoirs_accordes));
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text(`ARTICLE 3 – TYPE DE PROCURATION : ${val(contrat.type_procuration).toUpperCase()}`);
    if (contrat.type_procuration === 'limitée' && contrat.limites_precises) {
      doc.font('Helvetica').text(`Limites précises : ${val(contrat.limites_precises)}`);
    } else {
      doc.font('Helvetica').text(`La présente procuration est générale et couvre tous les actes de gestion et d'administration.`);
    }
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 4 – DURÉE');
    doc.font('Helvetica').text(`La présente procuration est valable pour une durée de : ${val(contrat.duree)}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 5 – RÉVOCATION');
    doc.font('Helvetica').text(`Le Mandant se réserve le droit de révoquer la présente procuration à tout moment par notification écrite adressée au Mandataire.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 6 – RESPONSABILITÉ');
    doc.font('Helvetica').text(`Le Mandataire agit au nom et pour le compte du Mandant. Il est responsable de ses actes dans les limites des pouvoirs qui lui ont été conférés.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 7 – EXPIRATION');
    doc.font('Helvetica').text(`La procuration expire automatiquement à l'issue de la durée prévue ou en cas de décès, d'incapacité ou de révocation par le Mandant.`);
    doc.moveDown(1.5);

    doc.font('Helvetica').text(`Fait à ${val(contrat.ville_signature)}, le ${today}`);
    doc.moveDown(2);
    doc.text('Le Mandant                                Le Mandataire');
    doc.moveDown(3);
    doc.text('Signature :                               Signature :');

    doc.end();
  });
};
