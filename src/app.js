const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { corsConfig, rateLimitConfig } = require('./config/security');

const app = express();

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
const gestionfacturesRoutes   = require('./routes/admin/gestionfacture.route');
const gestionadminsRoutes     = require('./routes/admin/gestionAdmin.route');
const contratTravailRoutes    = require('./routes/professionnel/contratTravail/contratTravail.routes');
const fichePaieRoutes         = require('./routes/professionnel/fichePaie/fichePaie.route');
const quittanceLoyerRoutes    = require('./routes/professionnel/quittanceLoyer/quittanceLoyer.route');
const etatLogementRoutes      = require('./routes/professionnel/etatLogement/etatLogement.route');
const contratBailRoutes       = require('./routes/professionnel/contraImmobilier/generation.route');

// ── Routes Autres Contrats ─────────────────────────────────────
const contratPrestationRoutes     = require('./routes/professionnel/autresContrats/contratPrestation/contratPrestation.routes');
const contratPartenariatRoutes    = require('./routes/professionnel/autresContrats/contratPartenariat/contratPartenariat.routes');
const contratLocationRoutes       = require('./routes/professionnel/autresContrats/contratLocation/contratLocation.routes');
const reconnaissanceDetteRoutes   = require('./routes/professionnel/autresContrats/reconnaissanceDette/reconnaissanceDette.routes');
const procurationRoutes           = require('./routes/professionnel/autresContrats/procuration/procuration.routes');
const contratCautionRoutes        = require('./routes/professionnel/autresContrats/contratCaution/contratCaution.routes');
const contratConfidentialiteRoutes = require('./routes/professionnel/autresContrats/contratConfidentialite/contratConfidentialite.routes');


// Serveur fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Définition des routes existantes ──────────────────────────
app.use('/sign/auth', authRoutes);
app.use('/sign/account', accountRoutes);
app.use('/sign/professionnel/document', generationrapportRoutes);
app.use('/sign/professionnel/client', gestionclientRoutes);
app.use('/sign/professionnel/contratBail', contratBailRoutes);
app.use('/sign/professionnel/contratTravail', contratTravailRoutes);
app.use('/sign/professionnel', fichePaieRoutes);
app.use('/sign/professionnel/etat-logement', etatLogementRoutes);
app.use('/sign/professionnel', quittanceLoyerRoutes);
app.use('/sign/admin', gestionutilisateursRoutes);
app.use('/sign/admin', gestionfacturesRoutes);
app.use('/sign/admin', gestionadminsRoutes);

// ── Définition des routes Autres Contrats ─────────────────────
app.use('/sign/professionnel/contrat-prestation',      contratPrestationRoutes);
app.use('/sign/professionnel/contrat-partenariat',     contratPartenariatRoutes);
app.use('/sign/professionnel/contrat-location',        contratLocationRoutes);
app.use('/sign/professionnel/reconnaissance-dette',    reconnaissanceDetteRoutes);
app.use('/sign/professionnel/procuration',             procurationRoutes);
app.use('/sign/professionnel/contrat-caution',         contratCautionRoutes);
app.use('/sign/professionnel/contrat-confidentialite', contratConfidentialiteRoutes);

module.exports = app;
