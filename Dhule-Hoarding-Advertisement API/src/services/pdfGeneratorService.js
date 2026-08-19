const puppeteer = require("puppeteer");
const { PDF_RENDER_OPTIONS } = require("../utils/shared-pdf-options");
const { locateSignatureWidget } = require("../modules/registerComplaint/SignaturePlacement");

// generatePdfFromHtml now returns both the buffer and the live page's placement info
async function generatePdfFromHtml(html) {
  if (!html) {
    throw new Error("HTML is required to generate PDF");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"],
    });

    // Locate the signature widget BEFORE generating the final PDF,
    // using the exact same page/render options for consistency.
    const placement = await locateSignatureWidget(page);

    const pdfBuffer = await page.pdf(PDF_RENDER_OPTIONS);

    return {
      pdfBuffer: Buffer.from(pdfBuffer),
      placement, // { pageNumber, widgetRect } or null
    };
  } finally {
    await browser.close();
  }
}


module.exports = {
  generatePdfFromHtml,
};