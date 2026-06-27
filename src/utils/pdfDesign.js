/**
 * pdfDesign.js
 * Helpers de design pour tous les PDF contracts
 * - Header avec logo optionnel
 * - Typographie cohérente
 * - Couleurs et spacing professionnels
 */

const https = require('https');
const http  = require('http');

async function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Résout une image (URL ou base64) en Buffer.
 * Retourne null si invalide/absent.
 */
async function resolveImageBuffer(src) {
  if (!src || !src.trim()) return null;
  try {
    if (src.startsWith('http')) return await fetchImageBuffer(src);
    const raw = src.replace(/^data:image\/[a-z+]+;base64,/i, '');
    return Buffer.from(raw, 'base64');
  } catch (e) {
    logger.warn('[pdfDesign] Image invalide:', e.message);
    return null;
  }
}

const COLORS = {
  dark: '#1F2937',        // Charcoal (headers, titles)
  primary: '#2563EB',     // Blue (emphasis)
  lightGrey: '#F3F4F6',   // Light background
  borderGrey: '#E5E7EB',  // Borders
  textDark: '#111827',    // Body text
  textMedium: '#4B5563',  // Secondary text
  textLight: '#9CA3AF',   // Light text
};

/**
 * Dessine l'en-tête du contrat avec logo optionnel
 * Si logo existe → le montre à gauche
 * Si pas de logo → pas d'espace réservé
 */
// logoBuffer : Buffer pré-résolu (via resolveImageBuffer) ou null
function drawHeader(doc, { logoBuffer, titre, sousTitre, numero, date, ville }) {
  const pageWidth  = doc.page.width;
  const margin     = doc.page.margins.left;
  const maxWidth   = pageWidth - 2 * margin;
  const BAND_H     = 72;
  const bandY      = doc.y;

  doc.save();
  doc.rect(margin, bandY, maxWidth, BAND_H).fill('#111111');
  doc.restore();

  const hasLogo = !!logoBuffer;
  if (hasLogo) {
    try {
      doc.image(logoBuffer, margin + 10, bandY + 6, { fit: [60, 60] });
    } catch (err) {
      logger.warn('⚠️ Logo invalide:', err.message);
    }
  }

  // ── Titre en blanc, centré verticalement dans la bande ────
  const titleX     = hasLogo ? margin + 80 : margin;
  const titleWidth = hasLogo ? maxWidth - 80 : maxWidth;
  const titleY     = bandY + (BAND_H / 2) - 12;

  doc.font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#FFFFFF')
    .text(titre, titleX, titleY, {
      width: titleWidth,
      align: 'center',
      lineGap: 0,
    });

  // ── Sous-bande grise pour numéro / date / ville ───────────
  const subBandY = bandY + BAND_H;
  doc.save();
  doc.rect(margin, subBandY, maxWidth, 20).fill('#333333');
  doc.restore();

  let infoText = '';
  if (numero) infoText += `N° ${numero}`;
  if (date)   infoText += infoText ? `   •   ${date}` : date;
  if (ville)  infoText += infoText ? `   •   ${ville}` : ville;

  if (infoText) {
    doc.font('Helvetica')
      .fontSize(8)
      .fillColor('#CCCCCC')
      .text(infoText, margin, subBandY + 6, {
        width: maxWidth,
        align: 'center',
        lineBreak: false,
      });
  }

  if (sousTitre) {
    doc.moveDown(0.5);
    doc.font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.textMedium)
      .text(sousTitre, margin, doc.y, {
        width: maxWidth,
        align: 'center',
      });
  }

  // Placer le curseur après le header
  doc.y = subBandY + 20 + (sousTitre ? 28 : 0);
  doc.moveDown(0.8);
}

/**
 * Dessine une section avec titre
 * Ex: "ARTICLE 1 – NOM DE LA SECTION"
 */
function drawSection(doc, { titre, contenu, indent = false }) {
  const margin = doc.page.margins.left;
  const maxWidth = doc.page.width - 2 * margin;

  doc.font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.dark)
    .text(titre, {
      width: maxWidth,
      lineGap: 1,
    });

  doc.moveDown(0.3);

  if (contenu) {
    doc.font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.textDark);

    if (Array.isArray(contenu)) {
      contenu.forEach((line, idx) => {
        const indentVal = indent ? 20 : 0;
        doc.text(line, { indent: indentVal, lineGap: 0.5 });
      });
    } else {
      doc.text(contenu, { lineGap: 0.5 });
    }
  }

  doc.moveDown(0.5);
}

/**
 * Dessine une grille info (2 colonnes)
 * Ex: Total / Reste à payer
 */
function drawInfoGrid(doc, infos) {
  const margin = doc.page.margins.left;
  const maxWidth = doc.page.width - 2 * margin;
  const colWidth = maxWidth / 2 - 8;

  const startY = doc.y;

  infos.forEach((info, idx) => {
    const isLeft = idx % 2 === 0;
    const x = isLeft ? margin : margin + maxWidth / 2 + 8;
    const y = isLeft ? startY : startY;

    doc.font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.textLight)
      .text(info.label, x, y, { width: colWidth });

    doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.primary)
      .text(info.value, x, doc.y, { width: colWidth });

    if (!isLeft) {
      doc.moveDown(0.6);
    }
  });

  if (infos.length % 2 === 1) {
    doc.moveDown(0.6);
  }

  doc.moveDown(0.3);
}

/**
 * Partie signature
 * Affiche lignes de signature pour 2 parties
 */
// signature1 = base64 de la signature du générateur (optionnel)
// signature2 = laissé vide (autre partie signe plus tard)
// signatureBuffer1 : Buffer générateur  signatureBuffer2 : Buffer destinataire (après contresignature)
function drawSignatures(doc, { partie1, partie2, dateSignature, signatureBuffer1, signatureBuffer2 }) {
  const margin   = doc.page.margins.left;
  const maxWidth = doc.page.width - 2 * margin;
  const colWidth = maxWidth / 2 - 8;
  const col2X    = margin + maxWidth / 2 + 8;

  doc.moveDown(1.2);

  doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDark);

  if (dateSignature) {
    doc.text(`Fait à __, le ${dateSignature}`);
    doc.moveDown(0.8);
  }

  const blockY = doc.y;

  // ── Labels des parties ────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.dark);
  doc.text(partie1, margin, blockY, { width: colWidth });
  doc.text(partie2, col2X,  blockY, { width: colWidth });

  const sigY = blockY + 18;

  // ── Signature du générateur ───────────────────────────────
  if (signatureBuffer1) {
    try {
      doc.image(signatureBuffer1, margin, sigY, { fit: [colWidth, 50] });
    } catch (e) {
      logger.error('[pdfDesign] Erreur affichage signature1:', e.message);
    }
  }

  // ── Signature du destinataire (présente après contresignature) ──
  if (signatureBuffer2) {
    try {
      doc.image(signatureBuffer2, col2X, sigY, { fit: [colWidth, 50] });
    } catch (e) {
      logger.error('[pdfDesign] Erreur affichage signature2:', e.message);
    }
  }

  const lineY = sigY + 52;

  // ── Lignes de signature ───────────────────────────────────
  doc.save();
  doc.moveTo(margin, lineY).lineTo(margin + colWidth, lineY).stroke(COLORS.borderGrey);
  doc.moveTo(col2X,  lineY).lineTo(col2X  + colWidth, lineY).stroke(COLORS.borderGrey);
  doc.restore();

  doc.font('Helvetica').fontSize(9).fillColor(COLORS.textLight);
  doc.text('Signature', margin, lineY + 3, { width: colWidth });
  doc.text('Signature', col2X,  lineY + 3, { width: colWidth });

  doc.y = lineY + 20;
}

/**
 * Utilitaires de formatage
 */
const val = v => (v !== undefined && v !== null && v !== '' && v !== false) ? String(v) : '—';
const boolVal = v => v ? 'Oui' : 'Non';
const today = () => new Date().toLocaleDateString('fr-FR');
const logger = require('./logger');

module.exports = {
  COLORS,
  drawHeader,
  drawSection,
  drawInfoGrid,
  drawSignatures,
  resolveImageBuffer,
  val,
  boolVal,
  today,
};
