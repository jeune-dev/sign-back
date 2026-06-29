const PDFDocument = require('pdfkit');
const { attachFooter } = require('../../../utils/pdfFooter');

module.exports = async function etatLogementTemplate(data) {

  const {
    numero_etat,
    proprietaire,
    locataire,
    logement,
    etat,
    signature_bailleur
  } = data;

  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    attachFooter(doc);

    // =========================
    // HEADER
    // =========================

    // Logo propriétaire (si présent)
    if (proprietaire?.logo && proprietaire.logo.trim()) {
      try {
        const raw = proprietaire.logo.replace(/^data:image\/[a-z+]+;base64,/i, '');
        const logoBuf = Buffer.from(raw, 'base64');
        doc.image(logoBuf, 40, doc.y, { fit: [60, 60] });
        doc.moveDown(0.5);
      } catch (_) {}
    }

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

    const sigY = doc.y;
    const leftX = 40;
    const rightX = 320;
    const sigWidth = 160;
    const sigHeight = 70;

    // Titre colonnes
    doc.fontSize(10)
      .text('Le Propriétaire', leftX, sigY, { width: sigWidth, align: 'center' })
      .text('Le Locataire', rightX, sigY, { width: sigWidth, align: 'center' });

    doc.moveDown(0.5);
    const imgY = doc.y;

    // Signature bailleur
    if (signature_bailleur) {
      try {
        const raw = signature_bailleur.replace(/^data:image\/[a-z+]+;base64,/i, '');
        const sigBuf = Buffer.from(raw, 'base64');
        doc.image(sigBuf, leftX + 10, imgY, { fit: [sigWidth - 20, sigHeight] });
      } catch (_) {
        doc.rect(leftX, imgY, sigWidth, sigHeight).stroke();
        doc.text('(Signature)', leftX, imgY + sigHeight / 2 - 6, { width: sigWidth, align: 'center' });
      }
    } else {
      doc.rect(leftX, imgY, sigWidth, sigHeight).stroke();
    }

    // Zone signature locataire (vide, sera signée plus tard)
    doc.rect(rightX, imgY, sigWidth, sigHeight).stroke();
    doc.fontSize(8).fillColor('#999999')
      .text('En attente de signature', rightX, imgY + sigHeight / 2 - 4, { width: sigWidth, align: 'center' });
    doc.fillColor('#000000');

    doc.y = imgY + sigHeight + 10;
    doc.moveDown();

    // Noms sous les signatures
    doc.fontSize(9)
      .text(
        `${val(proprietaire?.prenom)} ${val(proprietaire?.nom)}`,
        leftX, doc.y, { width: sigWidth, align: 'center' }
      )
      .text(
        locataire ? `${val(locataire?.prenom)} ${val(locataire?.nom)}` : '—',
        rightX, doc.y, { width: sigWidth, align: 'center' }
      );

    doc.end();
  });
};