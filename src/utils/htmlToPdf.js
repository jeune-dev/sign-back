'use strict';

const puppeteer = require('puppeteer');

/**
 * Convertit une chaîne HTML en Buffer PDF A4 via Puppeteer/Chromium.
 * Remplace html-pdf/PhantomJS (abandonné) — API identique côté appelant.
 *
 * @param {string} html  - HTML complet à convertir
 * @param {{ top?: string, right?: string, bottom?: string, left?: string }} [margin]
 * @returns {Promise<Buffer>}
 */
async function htmlToPdf(html, margin = { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' }) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin,
    });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

module.exports = htmlToPdf;
