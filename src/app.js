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


// Routes
const authRoutes = require('./routes/auth.route');
const accountRoutes = require('./routes/account.route');
const generationrapportRoutes = require('./routes/professionnel/generationrapport.route');
const gestionclientRoutes = require('./routes/professionnel/gestionclient.route');
const gestionutilisateursRoutes = require('./routes/admin/gestionutilisateur.route');
const gestionfacturesRoutes = require('./routes/admin/gestionfacture.route');
const gestionadminsRoutes = require('./routes/admin/gestionAdmin.route');
const contratTravailRoutes = require('./routes/professionnel/contratTravail/contratTravail.routes');
const fichePaieRoutes = require('./routes/professionnel/fichePaie/fichePaie.route');
const quittanceLoyerRoutes = require('./routes/professionnel/quittanceLoyer/quittanceLoyer.route');
const dashboardRoutes = require('./routes/professionnel/dashboard.route');



const contratBailRoutes = require('./routes/professionnel/contraImmobilier/generation.route');




// Serveur fichiers statiques pour les uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Définition des routes
app.use('/sign/auth', authRoutes);
app.use('/sign/account', accountRoutes);
app.use('/sign/professionnel/document', generationrapportRoutes);
app.use('/sign/professionnel/client', gestionclientRoutes);
app.use('/sign/professionnel/contratBail', contratBailRoutes); 
app.use('/sign/professionnel/contratTravail', contratTravailRoutes);
app.use('/sign/professionnel', fichePaieRoutes);
app.use('/sign/professionnel', quittanceLoyerRoutes);
app.use('/sign/admin', gestionutilisateursRoutes);
app.use('/sign/admin', gestionfacturesRoutes);
app.use('/sign/admin', gestionadminsRoutes);
app.use('/sign/professionnel/dashboard', dashboardRoutes);

module.exports = app;
