const puppeteer = require("puppeteer");


async function generatePdfFromHtml(html) {

  if (!html) {
    throw new Error(
      "HTML is required to generate PDF"
    );
  }


  const browser =
    await puppeteer.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });


  try {

    const page =
      await browser.newPage();


    await page.setContent(
      html,
      {
        waitUntil: [
          "load",
          "networkidle0",
        ],
      }
    );


    const pdfBuffer =
      await page.pdf({

        format: "A4",

        printBackground: true,

        preferCSSPageSize: true,

        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });


    return Buffer.from(
      pdfBuffer
    );

  } finally {

    await browser.close();

  }
}


module.exports = {
  generatePdfFromHtml,
};