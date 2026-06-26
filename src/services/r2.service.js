/**
 * r2.service.js — Stockage Cloudflare R2
 *
 * Remplace Cloudinary (images) et le stockage base64 en DB (PDFs).
 *
 * Variables d'environnement requises :
 *   R2_ACCOUNT_ID       — ID du compte Cloudflare
 *   R2_ACCESS_KEY_ID    — Clé d'accès R2
 *   R2_SECRET_ACCESS_KEY — Clé secrète R2
 *   R2_BUCKET_NAME      — Nom du bucket
 *   R2_PUBLIC_URL       — URL publique du bucket (ex: https://pub-xxx.r2.dev)
 *
 * Structure du bucket :
 *   images/             — Photos profil, logos, signatures (accès public)
 *   pdfs/               — Contrats, factures, quittances, fiches (accès privé via backend)
 */

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

// ── Client R2 ─────────────────────────────────────────────────────────────────
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

// ── Utilitaires ───────────────────────────────────────────────────────────────

/**
 * Convertit un ReadableStream (réponse S3) en Buffer.
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data',  chunk => chunks.push(chunk));
    stream.on('end',   ()    => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Détermine le Content-Type selon l'extension du fichier.
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.pdf':  'application/pdf'
  };
  return types[ext] || 'application/octet-stream';
}

// ── Upload image (photos profil, logos, signatures) ───────────────────────────

/**
 * Upload un fichier image directement vers R2 depuis un Buffer mémoire.
 * Aucun fichier temporaire n'est écrit sur disque.
 *
 * @param {Buffer} buffer        — Contenu du fichier (req.file.buffer via multer memoryStorage)
 * @param {string} originalname  — Nom original du fichier (req.file.originalname)
 * @param {string} [folder]      — Sous-dossier dans R2 (défaut: 'images')
 * @returns {string}             — URL publique de l'image
 */
async function uploadImage(buffer, originalname, folder = 'images') {
  const ext      = path.extname(originalname);
  const basename = path.basename(originalname, ext).replace(/\s+/g, '_');
  const filename = `${Date.now()}_${basename}${ext}`;
  const key      = `${folder}/${filename}`;

  await r2Client.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: getContentType(originalname),
  }));

  return `${PUBLIC_URL}/${key}`;
}

// ── Upload PDF (contrats, factures, quittances, fiches de paie) ───────────────

/**
 * Upload un PDF (Buffer) vers R2.
 *
 * @param {Buffer} pdfBuffer  — Buffer du PDF généré
 * @param {string} key        — Clé R2 (ex: 'pdfs/contrat-travail/CT-2025-001.pdf')
 * @returns {string}          — Clé R2 stockée en base de données
 */
async function uploadPdf(pdfBuffer, key) {
  await r2Client.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        pdfBuffer,
    ContentType: 'application/pdf',
  }));
  return key;
}

// ── Téléchargement PDF ────────────────────────────────────────────────────────

/**
 * Télécharge un PDF depuis R2 et retourne son Buffer.
 * Utilisé par les contrôleurs de téléchargement.
 *
 * @param {string} key  — Clé R2 stockée en base de données
 * @returns {Buffer}    — Buffer du PDF
 */
async function downloadPdf(key) {
  const response = await r2Client.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key:    key
  }));
  return streamToBuffer(response.Body);
}

// ── URL signée (optionnel — pour accès direct depuis le mobile) ───────────────

/**
 * Génère une URL signée temporaire pour accès direct depuis le mobile.
 *
 * @param {string} key          — Clé R2
 * @param {number} [expiresIn]  — Durée de validité en secondes (défaut: 3600 = 1h)
 * @returns {string}            — URL signée
 */
async function getSignedPdfUrl(key, expiresIn = 3600) {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

// ── Upload signature base64 (depuis Flutter SignaturePad) ────────────────────

/**
 * Reçoit une signature en base64 (data URL ou raw base64), l'upload sur R2
 * et retourne l'URL publique.
 *
 * @param {string} base64  — Data URL ("data:image/png;base64,...") ou raw base64
 * @returns {string}       — URL publique R2 de la signature
 */
async function uploadSignature(base64) {
  if (!base64) return null;

  let buffer;
  const dataUrlMatch = base64.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUrlMatch) {
    buffer = Buffer.from(dataUrlMatch[2], 'base64');
  } else {
    buffer = Buffer.from(base64, 'base64');
  }

  const key = `images/signatures/sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;

  await r2Client.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: 'image/png',
  }));

  return `${PUBLIC_URL}/${key}`;
}

// ── Suppression ───────────────────────────────────────────────────────────────

/**
 * Supprime un fichier de R2.
 *
 * @param {string} key  — Clé R2 ou URL publique complète
 */
async function deleteFile(key) {
  // Gérer le cas où on passe une URL complète au lieu d'une clé
  if (key.startsWith('http')) {
    key = key.replace(`${PUBLIC_URL}/`, '');
  }
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// ── Génération de clé PDF ─────────────────────────────────────────────────────

/**
 * Génère une clé R2 unique pour un PDF.
 *
 * @param {string} type          — Type de document (ex: 'contrat-travail')
 * @param {string} numeroContrat — Numéro du contrat
 * @returns {string}             — Clé R2 (ex: 'pdfs/contrat-travail/CT-2025-001_1704067200000.pdf')
 */
function makePdfKey(type, numeroContrat) {
  return `pdfs/${type}/${numeroContrat}_${Date.now()}.pdf`;
}

module.exports = {
  uploadImage,
  uploadSignature,
  uploadPdf,
  downloadPdf,
  getSignedPdfUrl,
  deleteFile,
  makePdfKey
};
