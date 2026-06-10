// Proxy vers resend.service.js — conservé pour compatibilité des imports existants
const { sendEmail } = require('../services/resend.service');
exports.sendEmail = sendEmail;
