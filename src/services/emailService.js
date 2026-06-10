// Proxy vers resend.service.js — conservé pour compatibilité des imports existants
const { sendDocumentEmail } = require('./resend.service');
module.exports = sendDocumentEmail;
