const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { corsConfig, rateLimitConfig } = require('./config/security');

const app = express();

// Render.com utilise un reverse proxy — nécessaire pour express-rate-limit
app.set('trust proxy', 1);

// Middlewares globaux
app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit(rateLimitConfig));


// ── Routes existantes ──────────────────────────────────────────
const authRoutes              = require('./routes/auth.route');
const accountRoutes           = require('./routes/account.route');
const generationrapportRoutes = require('./routes/professionnel/generationrapport.route');
const gestionclientRoutes     = require('./routes/professionnel/gestionclient.route');
const gestionutilisateursRoutes = require('./routes/admin/gestionutilisateur.route');
const gestionfacturesRoutes        = require('./routes/admin/gestionfacture.route');
const gestionadminsRoutes          = require('./routes/admin/gestionAdmin.route');
const gestioncontratsRoutes        = require('./routes/admin/gestionContrat.route');
const contratTravailRoutes         = require('./routes/professionnel/contratTravail/contratTravail.routes');
const fichePaieRoutes              = require('./routes/professionnel/fichePaie/fichePaie.route');
const quittanceLoyerRoutes         = require('./routes/professionnel/quittanceLoyer/quittanceLoyer.route');
const etatLogementRoutes           = require('./routes/professionnel/etatLogement/etatLogement.route');
const contratBailRoutes            = require('./routes/professionnel/contraImmobilier/generation.route');
const dashboardRoutes              = require('./routes/professionnel/dashboard.route');

// ── Routes Autres Contrats ─────────────────────────────────────
const contratPrestationRoutes      = require('./routes/professionnel/autresContrats/contratPrestation/contratPrestation.routes');
const contratPartenariatRoutes     = require('./routes/professionnel/autresContrats/contratPartenariat/contratPartenariat.routes');
const contratLocationRoutes        = require('./routes/professionnel/autresContrats/contratLocation/contratLocation.routes');
const reconnaissanceDetteRoutes    = require('./routes/professionnel/autresContrats/reconnaissanceDette/reconnaissanceDette.routes');
const procurationRoutes            = require('./routes/professionnel/autresContrats/procuration/procuration.routes');
const contratCautionRoutes         = require('./routes/professionnel/autresContrats/contratCaution/contratCaution.routes');
const contratConfidentialiteRoutes = require('./routes/professionnel/autresContrats/contratConfidentialite/contratConfidentialite.routes');

// ── Routes Particulier ─────────────────────────────────────────
const particulierDashboardRoutes   = require('./routes/particulier/dashboard.route');
const particulierFacturesRoutes    = require('./routes/particulier/factures.route');
const particulierContratsRoutes    = require('./routes/particulier/contrats.route');

// ── Définition des routes existantes ──────────────────────────
app.use('/sign/auth', authRoutes);
app.use('/sign/account', accountRoutes);
app.use('/sign/professionnel/document', generationrapportRoutes);
app.use('/sign/professionnel/client', gestionclientRoutes);
app.use('/sign/professionnel/contratBail', contratBailRoutes);
app.use('/sign/professionnel/contratTravail', contratTravailRoutes);
app.use('/sign/professionnel/fiche-paie', fichePaieRoutes);
app.use('/sign/professionnel/etat-logement', etatLogementRoutes);
app.use('/sign/professionnel/quittance-loyer', quittanceLoyerRoutes);
app.use('/sign/admin', gestionutilisateursRoutes);
app.use('/sign/admin', gestionfacturesRoutes);
app.use('/sign/admin', gestionadminsRoutes);
app.use('/sign/admin', gestioncontratsRoutes);
app.use('/sign/professionnel/dashboard', dashboardRoutes);

// ── Définition des routes Autres Contrats ─────────────────────
app.use('/sign/professionnel/contrat-prestation',      contratPrestationRoutes);
app.use('/sign/professionnel/contrat-partenariat',     contratPartenariatRoutes);
app.use('/sign/professionnel/contrat-location',        contratLocationRoutes);
app.use('/sign/professionnel/reconnaissance-dette',    reconnaissanceDetteRoutes);
app.use('/sign/professionnel/procuration',             procurationRoutes);
app.use('/sign/professionnel/contrat-caution',         contratCautionRoutes);
app.use('/sign/professionnel/contrat-confidentialite', contratConfidentialiteRoutes);

// ── Routes Particulier ─────────────────────────────────────────
app.use('/sign/particulier/dashboard', particulierDashboardRoutes);
app.use('/sign/particulier/factures',  particulierFacturesRoutes);
app.use('/sign/particulier/contrats',  particulierContratsRoutes);

// ── Middleware d'erreur global ─────────────────────────────────────────────────
const logger = require('./utils/logger');
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
});

module.exports = app;
