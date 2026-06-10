// Proxy vers r2.service — centralise tout le stockage de fichiers sur Cloudflare R2
const { uploadImage } = require('../services/r2.service');

module.exports = { uploadImage };
