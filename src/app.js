const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { corsConfig, rateLimitConfig } = require('./config/security');
const logger = require('./utils/logger');
const sequelize = require('./config/db');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Nginx tourne sur le même serveur → 1 seul proxy de confiance (loopback)
// Nécessaire pour que express-rate-limit lise X-Forwarded-For correctement
app.set('trust proxy', 1);

// ── Sécurité & headers ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsConfig));
app.use(cookieParser());

// ── Logging des requêtes entrantes ─────────────────────────────────────────
app.use(morgan(isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));

// ── Rate limiting global (100 req / 15 min) ────────────────────────────────
app.use(rateLimit(rateLimitConfig));

// ── Health check (hors versioning — utilisé par Docker / load balancer) ───
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected', uptime: process.uptime(), timestamp: Date.now() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes                   = require('./routes/auth.route');
const accountRoutes                = require('./routes/account.route');
const generationrapportRoutes      = require('./routes/professionnel/generationrapport.route');
const gestionclientRoutes          = require('./routes/professionnel/gestionclient.route');
const gestionutilisateursRoutes    = require('./routes/admin/gestionutilisateur.route');
const gestionfacturesRoutes        = require('./routes/admin/gestionfacture.route');
const gestionadminsRoutes          = require('./routes/admin/gestionAdmin.route');
const gestioncontratsRoutes        = require('./routes/admin/gestionContrat.route');
const statistiquesRoutes           = require('./routes/admin/statistiques.route');
const contratTravailRoutes         = require('./routes/professionnel/contratTravail/contratTravail.routes');
const fichePaieRoutes              = require('./routes/professionnel/fichePaie/fichePaie.route');
const quittanceLoyerRoutes         = require('./routes/professionnel/quittanceLoyer/quittanceLoyer.route');
const etatLogementRoutes           = require('./routes/professionnel/etatLogement/etatLogement.route');
const contratBailRoutes            = require('./routes/professionnel/contraImmobilier/generation.route');
const dashboardRoutes              = require('./routes/professionnel/dashboard.route');
const contratPrestationRoutes      = require('./routes/professionnel/autresContrats/contratPrestation/contratPrestation.routes');
const contratPartenariatRoutes     = require('./routes/professionnel/autresContrats/contratPartenariat/contratPartenariat.routes');
const contratLocationRoutes        = require('./routes/professionnel/autresContrats/contratLocation/contratLocation.routes');
const reconnaissanceDetteRoutes    = require('./routes/professionnel/autresContrats/reconnaissanceDette/reconnaissanceDette.routes');
const procurationRoutes            = require('./routes/professionnel/autresContrats/procuration/procuration.routes');
const contratCautionRoutes         = require('./routes/professionnel/autresContrats/contratCaution/contratCaution.routes');
const contratConfidentialiteRoutes = require('./routes/professionnel/autresContrats/contratConfidentialite/contratConfidentialite.routes');
const particulierDashboardRoutes   = require('./routes/particulier/dashboard.route');
const particulierFacturesRoutes    = require('./routes/particulier/factures.route');
const particulierContratsRoutes    = require('./routes/particulier/contrats.route');

// ── Montage /sign/v1/ ──────────────────────────────────────────────────────
app.use('/sign/v1/auth',                              authRoutes);
app.use('/sign/v1/account',                           accountRoutes);
app.use('/sign/v1/professionnel/document',            generationrapportRoutes);
app.use('/sign/v1/professionnel/client',              gestionclientRoutes);
app.use('/sign/v1/professionnel/contratBail',         contratBailRoutes);
app.use('/sign/v1/professionnel/contratTravail',      contratTravailRoutes);
app.use('/sign/v1/professionnel/fiche-paie',          fichePaieRoutes);
app.use('/sign/v1/professionnel/etat-logement',       etatLogementRoutes);
app.use('/sign/v1/professionnel/quittance-loyer',     quittanceLoyerRoutes);
app.use('/sign/v1/admin',                             gestionutilisateursRoutes);
app.use('/sign/v1/admin',                             gestionfacturesRoutes);
app.use('/sign/v1/admin',                             gestionadminsRoutes);
app.use('/sign/v1/admin',                             gestioncontratsRoutes);
app.use('/sign/v1/admin',                             statistiquesRoutes);
app.use('/sign/v1/professionnel/dashboard',           dashboardRoutes);
app.use('/sign/v1/professionnel/contrat-prestation',      contratPrestationRoutes);
app.use('/sign/v1/professionnel/contrat-partenariat',     contratPartenariatRoutes);
app.use('/sign/v1/professionnel/contrat-location',        contratLocationRoutes);
app.use('/sign/v1/professionnel/reconnaissance-dette',    reconnaissanceDetteRoutes);
app.use('/sign/v1/professionnel/procuration',             procurationRoutes);
app.use('/sign/v1/professionnel/contrat-caution',         contratCautionRoutes);
app.use('/sign/v1/professionnel/contrat-confidentialite', contratConfidentialiteRoutes);
app.use('/sign/v1/particulier/dashboard',             particulierDashboardRoutes);
app.use('/sign/v1/particulier/factures',              particulierFacturesRoutes);
app.use('/sign/v1/particulier/contrats',              particulierContratsRoutes);

// ── 404 — route inconnue ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ressource introuvable' });
});

// ── Middleware d'erreur global ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
  const status = err.status || 500;
  // En production, on ne divulgue jamais le détail d'une erreur 500 au client
  // (évite de fuiter des messages internes : SQL, chemins, etc.)
  const message = (isProd && status >= 500)
    ? 'Erreur interne du serveur'
    : (err.message || 'Erreur interne du serveur');
  res.status(status).json({ success: false, message });
});

module.exports = app;
