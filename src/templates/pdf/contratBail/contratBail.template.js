/**
 * contratBailTemplate(data)
 * Génère un buffer .pdf professionnel pour un contrat de bail noir & blanc.
 *
 * Dépendance : npm install pdfkit
 *
 * @param {Object} data
 * @returns {Promise<Buffer>}
 *
 * Usage :
 *   const generate = require('./contratBailTemplate');
 *   const buf = await generate(data);
 *   fs.writeFileSync('contrat.pdf', buf);
 */

const PDFDocument = require('pdfkit');
const https = require('https');
const http  = require('http');
const { attachFooter } = require('../../../utils/pdfFooter');

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

module.exports = async function contratBailTemplate(data) {
  const {
    numero_contrat,
    bailleur,
    locataires = [],
    bien,
    bail,
    paiement,
    depot_garantie,
    clauses,
    signature,
  } = data;

  // ── Utilitaires ───────────────────────────────────────────
  const fmt = n => Math.round(Number(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const val = v => (v !== undefined && v !== null && v !== '' && v !== false) ? String(v) : '—';
  const fmtMoyen = v => v === 'ALL' ? 'Tout mode de paiement' : val(v);
  const boolVal = v => v ? 'Oui' : 'Non';
  const today = new Date().toLocaleDateString('fr-FR');

  // ── Palette ───────────────────────────────────────────────
  const BLACK      = '#000000';
  const WHITE      = '#FFFFFF';
  const LIGHT_GRAY = '#F4F4F4';
  const MID_GRAY   = '#CCCCCC';
  const DARK_GRAY  = '#555555';

  // ── Dimensions A4 (points : 1pt = 1/72 inch) ─────────────
  const PAGE_W   = 595.28;
  const PAGE_H   = 841.89;
  const MARGIN   = 45;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: `Contrat de bail ${numero_contrat}`,
        Author: bailleur.nomEntreprise || `${bailleur.prenom} ${bailleur.nom}`,
        Subject: 'Contrat de bail résidentiel',
      }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    attachFooter(doc);

    let y = MARGIN; // curseur vertical courant

    // ════════════════════════════════════════════════════════
    // HELPERS DE DESSIN
    // ════════════════════════════════════════════════════════

    /** Vérifie si on a besoin d'une nouvelle page */
    function checkPage(needed = 60) {
      if (y + needed > PAGE_H - MARGIN) {
        doc.addPage();
        y = MARGIN;
        drawPageHeader();
        y += 20;
      }
    }

    /** En-tête répété sur chaque page (sauf la première) */
    function drawPageHeader() {
      doc
        .fontSize(8)
        .fillColor(DARK_GRAY)
        .text(`CONTRAT DE BAIL  —  N° ${val(numero_contrat)}`, MARGIN, y, {
          width: CONTENT_W - 60,
          align: 'left',
        })
        .text(`Page ${doc.bufferedPageRange().start + doc.bufferedPageRange().count}`, MARGIN, y, {
          width: CONTENT_W,
          align: 'right',
        });
      y += 14;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(0.5).strokeColor(MID_GRAY).stroke();
      y += 8;
    }

    /** Trait horizontal épais */
    function thickRule(color = BLACK, lw = 1.5) {
      doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(lw).strokeColor(color).stroke();
      y += 6;
    }

    /** Trait fin */
    function thinRule() {
      doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(0.4).strokeColor(MID_GRAY).stroke();
      y += 4;
    }

    /** Espace vertical */
    function spacer(h = 10) { y += h; }

    /**
     * Titre de section : fond noir, texte blanc
     */
    function sectionTitle(text) {
      checkPage(30);
      const h = 22;
      doc.rect(MARGIN, y, CONTENT_W, h).fill(BLACK);
      doc
        .fontSize(10)
        .fillColor(WHITE)
        .font('Helvetica-Bold')
        .text(text.toUpperCase(), MARGIN + 10, y + 6, { width: CONTENT_W - 20 });
      y += h + 6;
    }

    /**
     * Sous-titre (1.1, 1.2 …)
     */
    function subTitle(text) {
      checkPage(20);
      doc
        .fontSize(10)
        .fillColor(BLACK)
        .font('Helvetica-Bold')
        .text(text, MARGIN, y);
      y += 16;
    }

    /**
     * Ligne étiquette / valeur sur deux colonnes avec fond alterné
     * @param {string} label
     * @param {string} value
     * @param {number} labelW  — largeur de la colonne label (défaut 180)
     */
    function infoRow(label, value, labelW = 180) {
      const padding = 6;
      const valueW = CONTENT_W - labelW;

      // 🔹 Calcul hauteur dynamique
      const labelHeight = doc.heightOfString(label, {
        width: labelW - 10,
      });

      const valueHeight = doc.heightOfString(val(value), {
        width: valueW - 10,
      });

      const ROW_H = Math.max(labelHeight, valueHeight) + 10;

      checkPage(ROW_H + 2);

      // Fond label
      doc.rect(MARGIN, y, labelW, ROW_H).fill(LIGHT_GRAY);

      // Bordures
      doc.rect(MARGIN, y, CONTENT_W, ROW_H).lineWidth(0.4).strokeColor(MID_GRAY).stroke();
      doc.moveTo(MARGIN + labelW, y).lineTo(MARGIN + labelW, y + ROW_H).strokeColor(MID_GRAY).stroke();

      // Texte label
      doc
        .fontSize(8.5)
        .fillColor(DARK_GRAY)
        .font('Helvetica-Bold')
        .text(label, MARGIN + padding, y + 5, {
          width: labelW - 10,
        });

      // Texte valeur
      doc
        .fontSize(8.5)
        .fillColor(BLACK)
        .font('Helvetica')
        .text(val(value), MARGIN + labelW + padding, y + 5, {
          width: valueW - 10,
        });

      y += ROW_H;
    }

    /**
     * Tableau financier : en-têtes + lignes
     */
    function financeTable(rows, totalLabel, totalValue, devise) {
      const cols = [CONTENT_W * 0.55, CONTENT_W * 0.25, CONTENT_W * 0.20];
      const HEADER_H = 20;
      const ROW_H = 16;

      checkPage(HEADER_H + ROW_H * (rows.length + 1) + 24);

      // En-tête
      let x = MARGIN;
      const headers = ['DÉSIGNATION', 'MONTANT', 'DEVISE'];
      headers.forEach((h, i) => {
        doc.rect(x, y, cols[i], HEADER_H).fill(BLACK);
        doc.fontSize(8.5).fillColor(WHITE).font('Helvetica-Bold')
           .text(h, x + 4, y + 6, { width: cols[i] - 8, align: 'center' });
        x += cols[i];
      });
      y += HEADER_H;

      // Lignes données
      rows.forEach((row, idx) => {
        x = MARGIN;
        const shade = idx % 2 === 1;
        cols.forEach((w, i) => {
          doc.rect(x, y, w, ROW_H).fill(shade ? LIGHT_GRAY : WHITE);
          doc.rect(x, y, w, ROW_H).lineWidth(0.3).strokeColor(MID_GRAY).stroke();
          doc.fontSize(8.5).fillColor(BLACK).font('Helvetica')
             .text(val(row[i]), x + 6, y + 4, { width: w - 10, align: i === 1 ? 'right' : 'left' });
          x += w;
        });
        y += ROW_H;
      });

      // Ligne total (fond noir)
      const TOTAL_H = 22;
      doc.rect(MARGIN, y, CONTENT_W, TOTAL_H).fill(BLACK);
      doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
         .text(totalLabel.toUpperCase(), MARGIN + 6, y + 6, { width: cols[0] - 10 });
      doc.fontSize(10).fillColor(WHITE).font('Helvetica-Bold')
         .text(`${fmt(totalValue)} ${devise}`, MARGIN + cols[0], y + 5, {
           width: cols[1] + cols[2] - 10,
           align: 'right',
         });
      y += TOTAL_H + 8;
    }

    /**
     * Bloc de texte justifié (pour les articles de loi)
     */
    function bodyText(text, indent = 0) {
      checkPage(30);
      doc.fontSize(9).fillColor(BLACK).font('Helvetica')
         .text(text, MARGIN + indent, y, { width: CONTENT_W - indent, align: 'justify' });
      y = doc.y + 6;
    }

    // ════════════════════════════════════════════════════════
    // PAGE 1 — COUVERTURE / EN-TÊTE
    // ════════════════════════════════════════════════════════

    // Logo bailleur (si présent) — affiché en haut à droite
    if (bailleur.logo && bailleur.logo.trim()) {
      try {
        const raw = bailleur.logo.replace(/^data:image\/[a-z+]+;base64,/i, '');
        const logoBuf = Buffer.from(raw, 'base64');
        doc.image(logoBuf, PAGE_W - MARGIN - 70, y, { fit: [70, 50] });
      } catch (_) {}
    }

    // Trait supérieur double
    doc.rect(MARGIN, y, CONTENT_W, 3).fill(BLACK);
    y += 7;
    doc.rect(MARGIN, y, CONTENT_W, 1).fill(BLACK);
    y += 14;

    // Titre principal
    doc.fontSize(32).fillColor(BLACK).font('Helvetica-Bold')
       .text('CONTRAT DE BAIL', MARGIN, y, { width: CONTENT_W, align: 'center' });
    y += 38;
    doc.fontSize(13).fillColor(DARK_GRAY).font('Helvetica')
       .text('RÉSIDENTIEL', MARGIN, y, { width: CONTENT_W, align: 'center' });
    y += 20;

    // Trait
    doc.rect(MARGIN, y, CONTENT_W, 1).fill(BLACK);
    y += 3;
    doc.rect(MARGIN, y, CONTENT_W, 3).fill(BLACK);
    y += 16;

    // Bloc numéro + date (2 colonnes)
    const halfW = CONTENT_W / 2 - 4;
    // Colonne gauche — numéro contrat (fond noir)
    doc.rect(MARGIN, y, halfW, 44).fill(BLACK);
    doc.fontSize(7.5).fillColor(WHITE).font('Helvetica-Bold')
       .text('N° DU CONTRAT', MARGIN + 8, y + 8, { width: halfW - 16 });
    doc.fontSize(14).fillColor(WHITE).font('Helvetica-Bold')
       .text(val(numero_contrat), MARGIN + 8, y + 20, { width: halfW - 16 });
    // Colonne droite — date (fond gris clair)
    doc.rect(MARGIN + halfW + 8, y, halfW, 44).lineWidth(1).strokeColor(BLACK).stroke();
    doc.fontSize(7.5).fillColor(DARK_GRAY).font('Helvetica-Bold')
       .text("DATE D'ÉTABLISSEMENT", MARGIN + halfW + 16, y + 8, { width: halfW - 16 });
    doc.fontSize(14).fillColor(BLACK).font('Helvetica-Bold')
       .text(today, MARGIN + halfW + 16, y + 20, { width: halfW - 16 });
    y += 60;

    // ════════════════════════════════════════════════════════
    // ARTICLE I — PARTIES
    // ════════════════════════════════════════════════════════
    sectionTitle('Article I — Parties au Contrat');

    subTitle('1.1  LE BAILLEUR');
    infoRow('Nom & Prénom',              `${val(bailleur.prenom)} ${val(bailleur.nom)}`);
    infoRow('Adresse',                   bailleur.adresse);
    infoRow('Téléphone',                 bailleur.telephone);
    infoRow('Email',                     bailleur.email);
    infoRow('Entreprise / Société',      bailleur.nomEntreprise);
    infoRow('Registre de Commerce (RC)', bailleur.rc);
    infoRow('NINEA',                     bailleur.ninea);
    spacer(12);

    subTitle('1.2  LE(S) LOCATAIRE(S)');
    locataires.forEach((l, idx) => {
      if (locataires.length > 1) {
        checkPage(16);
        doc.fontSize(8.5).fillColor(DARK_GRAY).font('Helvetica-BoldOblique')
           .text(`Locataire ${idx + 1}`, MARGIN, y);
        y += 13;
      }
      infoRow('Nom & Prénom',     `${val(l.prenom)} ${val(l.nom)}`);
      infoRow('Adresse actuelle', l.adresse);
      infoRow('Téléphone',        l.telephone);
      infoRow('Email',            l.email);
      infoRow('Numéro CNI',       l.cni);
      if (idx < locataires.length - 1) spacer(8);
    });
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE II — BIEN LOUÉ
    // ════════════════════════════════════════════════════════
    sectionTitle('Article II — Désignation du Bien Loué');
    infoRow('Adresse complète',  bien.adresse);
    infoRow('Ville',             bien.ville);
    infoRow('Code Postal',       bien.code_postal);
    infoRow('Pays',              bien.pays);
    infoRow('Type de bien',      bien.type);
    infoRow('Superficie',        bien.superficie ? `${bien.superficie} m²` : null);
    infoRow('Nombre de pièces',  bien.nombre_pieces);
    infoRow('Étage',             bien.etage !== undefined && bien.etage !== null ? `${bien.etage}ème étage` : null);
    infoRow('Meublé',            boolVal(bien.meuble));
    infoRow('Parking',           boolVal(bien.parking));
    infoRow('Cave',              boolVal(bien.cave));
    infoRow('Balcon / Terrasse', boolVal(bien.balcon_terrasse));
    infoRow('Usage',             bien.usage);
    infoRow('Description',       bien.description);
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE III — DURÉE
    // ════════════════════════════════════════════════════════
    sectionTitle('Article III — Durée du Bail');
    infoRow('Date de début',               bail.date_debut);
    infoRow('Durée du bail',               bail.duree);
    infoRow("Date d'échéance",             bail.date_fin);
    infoRow('Renouvellement automatique',  typeof bail.renouvelable === 'boolean' ? boolVal(bail.renouvelable) : bail.renouvelable);
    infoRow('Délai de préavis',            bail.duree_preavis);
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE IV — LOYER & CHARGES
    // ════════════════════════════════════════════════════════
    sectionTitle('Article IV — Loyer & Charges');

    const devise = paiement.devise || 'FCFA';
    const totalMensuel =
      (paiement.montant_loyer   || 0) +
      (paiement.montant_charges || 0) +
      (paiement.autres_charges  || []).reduce((a, c) => a + (c.montant || 0), 0);

    const finRows = [
      ['Loyer mensuel de base', fmt(paiement.montant_loyer), devise],
      ['Charges locatives',     fmt(paiement.montant_charges || 0), devise],
      ...(paiement.autres_charges || []).map(c => [c.label, fmt(c.montant), devise]),
    ];
    financeTable(finRows, 'Total mensuel dû', totalMensuel, devise);

    infoRow('Charges incluses dans le loyer', typeof paiement.charges_incluses === 'boolean' ? boolVal(paiement.charges_incluses) : paiement.charges_incluses);
    infoRow("Jour d'exigibilité",             `Le ${val(paiement.jour_paiement)} de chaque mois`);
    infoRow('Périodicité',                    paiement.periodicite);
    infoRow('Mode de paiement',               fmtMoyen(paiement.moyen));

    // Infos bancaires si présentes
    if (paiement.info_paiement && Object.keys(paiement.info_paiement).length > 0) {
      const ip = paiement.info_paiement;
      if (ip.iban)               infoRow('IBAN',              ip.iban);
      if (ip.numeroCompte)       infoRow('N° de compte',      ip.numeroCompte);
      if (ip.nomBeneficiaire)    infoRow('Bénéficiaire',      ip.nomBeneficiaire);
      if (ip.numeroWave)         infoRow('Wave',              ip.numeroWave);
      if (ip.numeroOrangeMoney)  infoRow('Orange Money',      ip.numeroOrangeMoney);
    }
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE V — DÉPÔT DE GARANTIE
    // ════════════════════════════════════════════════════════
    sectionTitle('Article V — Dépôt de Garantie / Caution');
    infoRow('Dépôt de garantie prévu', boolVal(depot_garantie?.prevu));
    infoRow('Montant du dépôt',        `${fmt(depot_garantie?.montant || 0)} ${devise}`);
    infoRow('Date de versement',       depot_garantie?.date_versement);
    infoRow('Mode de paiement',        fmtMoyen(depot_garantie?.mode_paiement));
    spacer(8);
    checkPage(30);
    doc.fontSize(8).fillColor(DARK_GRAY).font('Helvetica-Oblique')
       .text(
         'Le dépôt de garantie sera restitué dans un délai maximum de deux (2) mois suivant la remise des clés, déduction faite des sommes dues par le locataire et des éventuels frais de remise en état.',
         MARGIN, y, { width: CONTENT_W, align: 'justify' }
       );
    y = doc.y + 14;

    // ════════════════════════════════════════════════════════
    // ARTICLE VI — CLAUSES
    // ════════════════════════════════════════════════════════
    sectionTitle('Article VI — Clauses & Conditions Particulières');
    infoRow('Sous-location',           clauses?.sous_location);
    infoRow('Animaux de compagnie',    clauses?.animaux);
    infoRow('Travaux & modifications', clauses?.travaux);
    infoRow('Clauses particulières',   clauses?.personnalisees);
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE VII — OBLIGATIONS
    // ════════════════════════════════════════════════════════
    sectionTitle('Article VII — Obligations des Parties');
    infoRow('Obligations du bailleur',
      'Assurer au locataire la jouissance paisible du bien loué, entretenir les locaux en bon état et effectuer les réparations nécessaires autres que locatives.', 200);
    infoRow('Obligations du locataire',
      'Payer le loyer aux termes convenus, user paisiblement des locaux, assurer les réparations locatives, souscrire une assurance habitation et en remettre l\'attestation au bailleur.', 200);
    infoRow('Assurance obligatoire',
      'Le locataire est tenu de souscrire une assurance multirisques habitation couvrant les risques locatifs avant son entrée dans les lieux.', 200);
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE VIII — RÉSILIATION
    // ════════════════════════════════════════════════════════
    sectionTitle('Article VIII — Résiliation du Contrat');
    checkPage(16);
    doc.fontSize(9).fillColor(BLACK).font('Helvetica')
       .text('Le présent contrat pourra être résilié dans les cas suivants :', MARGIN, y);
    y = doc.y + 8;
    infoRow('Résiliation par le locataire',
      `Préavis de ${val(bail.duree_preavis)} adressé par lettre recommandée avec accusé de réception.`);
    infoRow('Résiliation par le bailleur',
      'En cas de non-paiement du loyer ou des charges, après mise en demeure restée sans effet pendant 30 jours.');
    infoRow('Résiliation judiciaire',
      'En cas de manquement grave aux obligations contractuelles, par voie judiciaire conformément à la législation en vigueur.');
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE IX — DROIT APPLICABLE
    // ════════════════════════════════════════════════════════
    sectionTitle('Article IX — Droit Applicable & Litiges');
    bodyText(
      'Le présent contrat est régi par la législation sénégalaise en matière de baux à usage d\'habitation. En cas de litige, les parties s\'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, le tribunal compétent sera celui du ressort du lieu de situation du bien loué.'
    );
    spacer(14);

    // ════════════════════════════════════════════════════════
    // ARTICLE X — SIGNATURES
    // ════════════════════════════════════════════════════════
    checkPage(180);
    sectionTitle('Article X — Signatures');
    spacer(8);

    // Fait à … le …
    const sigDate  = signature?.date  || today;
    const sigVille = signature?.ville || bien?.ville || '___________';
    doc.fontSize(10).fillColor(BLACK).font('Helvetica-Bold')
       .text(`Fait à ${sigVille}, le ${sigDate}`, MARGIN, y, { width: CONTENT_W, align: 'center' });
    y = doc.y + 6;
    doc.fontSize(8.5).fillColor(DARK_GRAY).font('Helvetica-Oblique')
       .text('En deux (2) exemplaires originaux, dont un remis à chaque partie.', MARGIN, y, {
         width: CONTENT_W, align: 'center'
       });
    y = doc.y + 18;

    // Tableau de signatures (2 colonnes)
    const sigColW = CONTENT_W / 2 - 4;
    const SIG_BLOCK_H = 100;

    // En-têtes colonnes
    doc.rect(MARGIN, y, sigColW, 22).fill(BLACK);
    doc.rect(MARGIN + sigColW + 8, y, sigColW, 22).fill(BLACK);
    doc.fontSize(10).fillColor(WHITE).font('Helvetica-Bold')
       .text('LE BAILLEUR', MARGIN, y + 7, { width: sigColW, align: 'center' })
       .text('LE(S) LOCATAIRE(S)', MARGIN + sigColW + 8, y + 7, { width: sigColW, align: 'center' });
    y += 22;

    // Noms
    doc.rect(MARGIN, y, sigColW, 20).lineWidth(0.5).strokeColor(BLACK).stroke();
    doc.rect(MARGIN + sigColW + 8, y, sigColW, 20).lineWidth(0.5).strokeColor(BLACK).stroke();
    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
       .text(`${val(bailleur.prenom)} ${val(bailleur.nom)}`, MARGIN + 6, y + 6, { width: sigColW - 12 });
    const locNoms = (signature?.nom_locataire) ||
      locataires.map(l => `${val(l.prenom)} ${val(l.nom)}`).join(' — ');
    doc.text(locNoms, MARGIN + sigColW + 14, y + 6, { width: sigColW - 12 });
    y += 20;

    // Zone signature — bailleur
    doc.rect(MARGIN, y, sigColW, SIG_BLOCK_H).lineWidth(0.5).strokeColor(BLACK).stroke();
    if (bailleur?.signature) {
      try {
        let imgBuffer;
        if (bailleur.signature.startsWith('http')) {
          imgBuffer = await fetchImageBuffer(bailleur.signature);
        } else {
          const base64Data = bailleur.signature.replace(/^data:image\/\w+;base64,/, '');
          imgBuffer = Buffer.from(base64Data, 'base64');
        }
        const imgW = sigColW - 24;
        const imgH = SIG_BLOCK_H - 28;
        doc.image(imgBuffer, MARGIN + 12, y + 6, {
          fit:    [imgW, imgH],
          align:  'center',
          valign: 'center',
        });
      } catch (e) {
        console.error('[contratBail] Erreur chargement signature bailleur:', e.message);
      }
    }

    // Zone signature — locataire(s)
    doc.rect(MARGIN + sigColW + 8, y, sigColW, SIG_BLOCK_H).lineWidth(0.5).strokeColor(BLACK).stroke();

    // Labels bas de zone
    doc.fontSize(7.5).fillColor(DARK_GRAY).font('Helvetica')
       .text('Signature & cachet :', MARGIN + 6, y + SIG_BLOCK_H - 14, { width: sigColW - 12 })
       .text('Signature(s) :', MARGIN + sigColW + 14, y + SIG_BLOCK_H - 14, { width: sigColW - 12 });
    y += SIG_BLOCK_H + 20;

    // ════════════════════════════════════════════════════════
    // PIED DE PAGE FINAL
    // ════════════════════════════════════════════════════════
    checkPage(30);
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(2).strokeColor(BLACK).stroke();
    y += 3;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).lineWidth(0.5).strokeColor(BLACK).stroke();
    y += 8;
    const footerText = `Contrat N° ${val(numero_contrat)}  ·  ${bailleur.nomEntreprise || `${val(bailleur.prenom)} ${val(bailleur.nom)}`}  ·  Document confidentiel`;
    doc.fontSize(7.5).fillColor(DARK_GRAY).font('Helvetica')
       .text(footerText, MARGIN, y, { width: CONTENT_W, align: 'center' });

    doc.end();
  });
};