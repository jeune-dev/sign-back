/**
 * pdfFooter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Ajoute automatiquement un pied de page légal sur TOUTES les pages d'un
 * document PDFKit (première page + chaque nouvelle page + dernière page).
 *
 * Usage dans un template PDFKit :
 *
 *   const { attachFooter } = require('../../../utils/pdfFooter');
 *   const doc = new PDFDocument({ size: 'A4', margin: 50 });
 *   attachFooter(doc);          // ← juste après la création du doc
 *   // ... contenu normal ...
 *   doc.end();                  // le footer est dessiné automatiquement
 */

const FOOTER_TEXT =
  'Document généré, signé électroniquement et archivé par Sign. ' +
  'Les informations qu\'il contient sont réputées exactes à la date de signature. ' +
  'Conformément à la réglementation applicable en matière de preuve électronique au Sénégal, ' +
  'ce document, ainsi que ses données d\'authentification et d\'horodatage, ' +
  'peut être produit devant toute autorité compétente à titre de preuve des engagements constatés. ' +
  'Toute modification non autorisée du présent document est interdite.';

/**
 * Dessine le pied de page sur la page courante.
 * Utilise des coordonnées absolues → n'affecte pas le flux de texte.
 */
function _drawFooter(doc) {
  try {
    const pH  = doc.page.height;
    const pW  = doc.page.width;
    const mx  = 45;                   // marge horizontale
    const fw  = pW - mx * 2;          // largeur disponible
    const fy  = pH - 46;              // y de départ (dans la marge basse)

    // Temporarily disable bottom margin so PDFKit doesn't trigger a recursive
    // page break when we draw text below the normal content area (fy > maxY).
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.save();

    // ── Ligne de séparation fine ────────────────────────────────────────────
    doc
      .moveTo(mx, fy)
      .lineTo(pW - mx, fy)
      .lineWidth(0.35)
      .strokeColor('#C0C0C0')
      .stroke();

    // ── Pastille « SIGN » à gauche ──────────────────────────────────────────
    // Petit rectangle arrondi de fond
    doc
      .roundedRect(mx, fy + 5, 28, 11, 2)
      .fillColor('#1A1A1A')
      .fill();

    doc
      .fontSize(5.8)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('SIGN', mx + 1, fy + 7.2, { width: 26, align: 'center', lineBreak: false });

    // ── Texte légal centré ──────────────────────────────────────────────────
    doc
      .fontSize(5.6)
      .font('Helvetica')
      .fillColor('#9A9A9A')
      .text(FOOTER_TEXT, mx + 34, fy + 6, {
        width: fw - 34,
        align: 'justify',
        lineGap: 0.6,
        characterSpacing: 0.05,
      });

    doc.restore();
    doc.page.margins.bottom = savedBottom;
  } catch (_) {
    // Ne jamais faire crasher la génération PDF pour un footer
  }
}

/**
 * Attache le pied de page à un document PDFKit.
 * Gère automatiquement : première page, pages intermédiaires, dernière page.
 *
 * @param {PDFDocument} doc  Instance PDFKit
 */
function attachFooter(doc) {
  // Garde-fou anti-récursion : si le dessin du footer (qui écrit du texte près
  // du bas de page) déclenchait lui-même un 'pageAdded', on retombait dans une
  // cascade de pages (ex. contenu compact finissant tout près du bas). Ce flag
  // empêche tout dessin de footer ré-entrant.
  let drawing = false;
  const safeDraw = () => {
    if (drawing) return;
    drawing = true;
    try { _drawFooter(doc); } finally { drawing = false; }
  };

  // ── Pages intermédiaires (déclenchées par débordement de contenu) ──────────
  doc.on('pageAdded', () => {
    const topY = doc.page.margins ? doc.page.margins.top : 50;
    const topX = doc.page.margins ? doc.page.margins.left : 50;

    safeDraw();

    // Remettre le curseur au début de la zone de contenu SANS écrire de fragment
    // (doc.text('', …) pouvait perturber le flux et la pagination).
    doc.x = topX;
    doc.y = topY;
  });

  // ── Dernière page : intercept doc.end() ────────────────────────────────────
  const _originalEnd = doc.end.bind(doc);
  doc.end = function () {
    safeDraw();
    _originalEnd();
  };
}

module.exports = { attachFooter };
