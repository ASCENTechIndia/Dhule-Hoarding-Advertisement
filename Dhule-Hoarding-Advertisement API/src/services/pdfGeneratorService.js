const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const { PDF_RENDER_OPTIONS } = require("../utils/shared-pdf-options");

const {
  locateSignatureWidget,
} = require("../modules/registerComplaint/SignaturePlacement");

const CHROME_CACHE_PATH =
  "C:\\inetpub\\wwwroot\\Dhule-Advertisement\\Backend\\node_modules\\puppeteer\\.cache\\puppeteer\\chrome";

function findChromeExecutable() {
  if (!fs.existsSync(CHROME_CACHE_PATH)) {
    throw new Error(
      `Chrome cache directory does not exist: ${CHROME_CACHE_PATH}`
    );
  }

  function search(dir) {
    const entries = fs.readdirSync(dir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (
        entry.isFile() &&
        entry.name.toLowerCase() === "chrome.exe"
      ) {
        return fullPath;
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const result = search(
          path.join(dir, entry.name)
        );

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  const chromePath = search(CHROME_CACHE_PATH);

  if (!chromePath) {
    throw new Error(
      `chrome.exe not found inside: ${CHROME_CACHE_PATH}`
    );
  }

  return chromePath;
}

async function generatePdfFromHtml(html) {
  if (!html) {
    throw new Error(
      "HTML is required to generate PDF"
    );
  }

  const executablePath =
    findChromeExecutable();

  console.log(
    "Chrome executable:",
    executablePath
  );

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--disable-extensions",
      ],
    });

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: [
        "load",
        "networkidle0",
      ],
    });

    // Wait for all images
    await page.evaluate(async () => {
      const images =
        Array.from(document.images);

      await Promise.all(
        images.map((img) => {
          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    let placement = null;

    try {
      placement =
        await locateSignatureWidget(page);

      console.log(
        "Notice signature placement:",
        placement
      );
    } catch (error) {
      console.warn(
        "Signature placement failed:",
        error.message
      );
    }

    /*
     * Generate PDF
     */
    const pdfResult =
      await page.pdf(
        PDF_RENDER_OPTIONS
      );

    /*
     * FORCE Node Buffer
     */
    const pdfBuffer =
      Buffer.isBuffer(pdfResult)
        ? pdfResult
        : Buffer.from(
            pdfResult
          );

    console.log(
      "PDF GENERATOR RESULT:",
      {
        originalIsBuffer:
          Buffer.isBuffer(pdfResult),

        originalConstructor:
          pdfResult?.constructor?.name,

        originalType:
          typeof pdfResult,

        convertedIsBuffer:
          Buffer.isBuffer(pdfBuffer),

        length:
          pdfBuffer.length,

        header:
          pdfBuffer
            .subarray(0, 5)
            .toString(),
      }
    );

    if (
      !Buffer.isBuffer(pdfBuffer)
    ) {
      throw new Error(
        "Could not convert generated PDF to Buffer"
      );
    }

    if (
      pdfBuffer.length === 0
    ) {
      throw new Error(
        "Generated PDF is empty"
      );
    }

    return {
      pdfBuffer,
      placement,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generatePdfFromHtml,
};