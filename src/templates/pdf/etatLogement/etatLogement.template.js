const PDFDocument = require('pdfkit');

module.exports = async function etatLogementTemplate(data) {

  const {
    numero_etat,
    proprietaire,
    locataire,
    logement,
    etat
  } = data;

  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // =========================
    // HEADER
    // =========================
    doc.fontSize(18).text('ÉTAT DES LIEUX', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`N° État : ${val(numero_etat)}`);
    doc.text(`Date : ${today}`);
    doc.moveDown();

    // =========================
    // PARTIES
    // =========================
    doc.fontSize(11).text('Entre les soussignés :');
    doc.moveDown();

    doc.text('Le Propriétaire :');
    doc.text(
      `${val(proprietaire?.nom)} ${val(proprietaire?.prenom)}, ` +
      `domicilié à ${val(proprietaire?.adresse)}, ` +
      `téléphone ${val(proprietaire?.telephone)}, email ${val(proprietaire?.email)}.`
    );
    doc.text(`Ci-après dénommé « le Propriétaire »`);
    doc.moveDown();

    doc.text('ET');
    doc.moveDown();

    doc.text('Le Locataire :');
    doc.text(
      `${val(locataire?.nom)} ${val(locataire?.prenom)}, ` +
      `domicilié à ${val(locataire?.adresse)}, ` +
      `téléphone ${val(locataire?.telephone)}.`
    );
    doc.text(`Ci-après dénommé « le Locataire »`);
    doc.moveDown();

    // =========================
    // ARTICLE 1
    // =========================
    doc.text('ARTICLE 1 – OBJET');
    doc.text(
      `Le présent document a pour objet de décrire l’état du logement lors de l’état des lieux.`
    );
    doc.moveDown();

    // =========================
    // ARTICLE 2
    // =========================
    doc.text('ARTICLE 2 – DESCRIPTION DU LOGEMENT');
    doc.text(`Adresse : ${val(logement?.adresse)}`);
    doc.text(`Type : ${val(logement?.type)}`);
    doc.text(`Nombre de pièces : ${val(logement?.nombre_pieces)}`);
    doc.moveDown();

    // =========================
    // ARTICLE 3
    // =========================
    doc.text('ARTICLE 3 – ÉTAT GÉNÉRAL');

    const mapEtat = {
      bon: '☑ Bon état',
      moyen: '☑ État moyen',
      mauvais: '☑ Mauvais état'
    };

    doc.text(mapEtat[etat?.etat_general] || '—');
    doc.moveDown();

    // =========================
    // ARTICLE 4
    // =========================
    doc.text('ARTICLE 4 – DÉTAIL PAR PIÈCE');

    const pieces = Array.isArray(etat?.pieces)
      ? etat.pieces.filter(Boolean)
      : [];

    if (pieces.length === 0) {
      doc.text('Aucune pièce renseignée');
    } else {
      pieces.forEach(piece => {
        doc.text(
          `- ${val(piece?.nom)} : ${val(piece?.etat_sol || piece?.etat || '—')}`
        );
      });
    }

    doc.moveDown();

    // =========================
    // ARTICLE 5
    // =========================
    doc.text('ARTICLE 5 – ÉQUIPEMENTS');

    const equipements = Array.isArray(etat?.equipements)
      ? etat.equipements
      : [];

    doc.text(equipements.includes('electricite') ? '☑ Électricité fonctionnelle' : '☐ Électricité');
    doc.text(equipements.includes('eau') ? '☑ Eau fonctionnelle' : '☐ Eau');
    doc.text(equipements.includes('gaz') ? '☑ Gaz disponible' : '☐ Gaz');

    doc.moveDown();

    // =========================
    // ARTICLE 6
    // =========================
    doc.text('ARTICLE 6 – OBSERVATIONS');
    doc.text(val(etat?.observations));
    doc.moveDown();

    // =========================
    // ARTICLE 7
    // =========================
    doc.text('ARTICLE 7 – CONCLUSION');
    doc.text(`Le présent état des lieux est établi contradictoirement entre les parties.`);
    doc.text(`Il servira de référence lors de la restitution du logement.`);
    doc.moveDown();

    // =========================
    // SIGNATURE
    // =========================
    doc.text(
      `Fait à ${val(logement?.ville)}, le ${val(etat?.date_etat_des_lieux || etat?.date)}`
    );
    doc.moveDown(2);

    doc.text("Le Propriétaire                     Le Locataire");
    doc.moveDown(4);
    doc.text("Signature                          Signature");

    doc.end();
  });
};