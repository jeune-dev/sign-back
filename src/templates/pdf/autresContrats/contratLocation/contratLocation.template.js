const PDFDocument = require('pdfkit');

module.exports = async function contratLocationTemplate({ numero_contrat, generateur, autrePartie, contrat }) {
  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('CONTRAT DE LOCATION DE BIEN MOBILIER', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`N° ${numero_contrat}  |  Date : ${today}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS :');
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('LE PROPRIÉTAIRE :');
    doc.font('Helvetica').text(`${val(generateur.nom)} ${val(generateur.prenom)}  |  Email : ${val(generateur.email)}  |  Tél : ${val(generateur.telephone)}`);
    doc.text(`Ci-après dénommé « le Propriétaire »`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('LE LOCATAIRE :');
    doc.font('Helvetica').text(`${val(autrePartie.nom)} ${val(autrePartie.prenom)}  |  Email : ${val(autrePartie.email)}  |  Tél : ${val(autrePartie.telephone)}`);
    doc.text(`Ci-après dénommé « le Locataire »`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('ARTICLE 1 – DESCRIPTION DU BIEN');
    doc.font('Helvetica').text(`Type de bien : ${val(contrat.type_bien)}`);
    doc.text(`Description : ${val(contrat.description_bien)}`);
    doc.text(`État du bien : ${val(contrat.etat_bien)}`);
    doc.text(`Valeur estimée : ${val(contrat.valeur_estimee)} FCFA`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 2 – CONDITIONS DE LOCATION');
    doc.font('Helvetica').text(`Durée de location : ${val(contrat.duree_location)}`);
    doc.text(`Montant de la location : ${val(contrat.montant_location)} FCFA`);
    if (contrat.caution) {
      doc.text(`Caution : ${val(contrat.montant_caution)} FCFA`);
    }
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 3 – ENTRETIEN DU BIEN');
    doc.font('Helvetica').text(`Le Locataire s'engage à utiliser le bien avec soin et à en assurer l'entretien courant pendant la durée de la location.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 4 – RESTITUTION DU BIEN');
    doc.font('Helvetica').text(`À la fin de la location, le Locataire devra restituer le bien dans l'état dans lequel il l'a reçu, sous réserve de l'usure normale.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 5 – RESPONSABILITÉ');
    doc.font('Helvetica').text(`Le Locataire est responsable de tout dommage causé au bien pendant la durée de la location, sauf cas de force majeure.`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('ARTICLE 6 – DOMMAGES');
    doc.font('Helvetica').text(`En cas de dommages au bien, le Locataire devra rembourser les frais de remise en état selon une estimation contradictoire.`);
    doc.moveDown(1.5);

    doc.font('Helvetica').text(`Fait à ${val(contrat.ville_signature)}, le ${today}`);
    doc.moveDown(2);
    doc.text('Le Propriétaire                           Le Locataire');
    doc.moveDown(3);
    doc.text('Signature :                               Signature :');

    doc.end();
  });
};
