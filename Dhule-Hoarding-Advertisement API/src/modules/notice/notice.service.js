const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

const { PDFDocument } = require("pdf-lib");
const puppeteer = require("puppeteer");

const {
  repoGetNoticeById,
  repoGenerateNotice,
  repoGetCorporationInfo,
} = require("./notice.repo");

const {
  digitallySignPdf,
} = require("../../utils/digitalSignature");

const TEMPLATE_PATH = path.join(
  __dirname,
  "notice.template.html"
);

/*
|--------------------------------------------------------------------------
| SERVER CHROME PATH
|--------------------------------------------------------------------------
|
| Production server Puppeteer Chrome path
|
*/

function findChromeExecutable() {
  const possiblePaths = [

     // Chrome on your IIS production server
    "C:\\inetpub\\wwwroot\\Dhule-Advertisement\\Backend\\node_modules\\puppeteer\\.cache\\puppeteer\\chrome",

    // Google Chrome - Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",

   
    // Local Puppeteer cache
    path.join(
      process.cwd(),
      "node_modules",
      "puppeteer",
      ".cache",
      "puppeteer",
      "chrome"
    ),
  ];

  /*
  |--------------------------------------------------------------------------
  | Check direct Chrome executable paths
  |--------------------------------------------------------------------------
  */

  for (const chromePath of possiblePaths) {
    if (
      chromePath.toLowerCase().endsWith("chrome.exe") &&
      fsSync.existsSync(chromePath)
    ) {
      console.log(
        "Chrome executable found:",
        chromePath
      );

      return chromePath;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Recursively search cache folders
  |--------------------------------------------------------------------------
  */

  function searchDirectory(directory) {
    if (!fsSync.existsSync(directory)) {
      return null;
    }

    const entries =
      fsSync.readdirSync(
        directory,
        {
          withFileTypes: true,
        }
      );

    // Check files
    for (const entry of entries) {
      if (
        entry.isFile() &&
        entry.name.toLowerCase() === "chrome.exe"
      ) {
        return path.join(
          directory,
          entry.name
        );
      }
    }

    // Check folders
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const result =
          searchDirectory(
            path.join(
              directory,
              entry.name
            )
          );

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Search Puppeteer caches
  |--------------------------------------------------------------------------
  */

  const cachePaths = [
    "C:\\inetpub\\wwwroot\\Dhule-Advertisement\\Backend\\node_modules\\puppeteer\\.cache\\puppeteer\\chrome",

    path.join(
      process.cwd(),
      "node_modules",
      "puppeteer",
      ".cache",
      "puppeteer",
      "chrome"
    ),
  ];

  for (const cachePath of cachePaths) {
    const chromePath =
      searchDirectory(cachePath);

    if (chromePath) {
      console.log(
        "Chrome executable found:",
        chromePath
      );

      return chromePath;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Nothing found
  |--------------------------------------------------------------------------
  */

  throw new Error(
    [
      "Chrome executable could not be found.",
      "",
      "Please check whether Google Chrome is installed.",
      "",
      "Expected locations:",
      ...possiblePaths,
    ].join("\n")
  );
}

/*
|--------------------------------------------------------------------------
| Launch Chrome
|--------------------------------------------------------------------------
*/

async function launchChrome() {
  const executablePath =
    findChromeExecutable();

  console.log(
    "Launching Chrome:",
    executablePath
  );

  return await puppeteer.launch({
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
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-features=Translate,BackForwardCache",
    ],

    ignoreDefaultArgs: [
      "--disable-extensions",
    ],
  });
}

async function generatePdfFromHtml(html) {
  if (!html) {
    throw new Error(
      "HTML is required to generate PDF"
    );
  }

  let browser = null;

  try {
    /*
    |--------------------------------------------------------------------------
    | Launch Browser
    |--------------------------------------------------------------------------
    */

    browser =
      await launchChrome();

    /*
    |--------------------------------------------------------------------------
    | New Page
    |--------------------------------------------------------------------------
    */

    const page =
      await browser.newPage();

    /*
    |--------------------------------------------------------------------------
    | A4 Viewport
    |--------------------------------------------------------------------------
    */

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    /*
    |--------------------------------------------------------------------------
    | Increase Navigation Timeout
    |--------------------------------------------------------------------------
    |
    | Your previous error was:
    |
    | Navigation timeout of 30000 ms exceeded
    |
    */

    page.setDefaultNavigationTimeout(
      120000
    );

    page.setDefaultTimeout(
      120000
    );

    /*
    |--------------------------------------------------------------------------
    | Load HTML
    |--------------------------------------------------------------------------
    */

    console.log(
      "[PDF] Loading HTML..."
    );

    await page.setContent(
      html,
      {
        waitUntil: "domcontentloaded",

        timeout: 120000,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Wait For Fonts
    |--------------------------------------------------------------------------
    */

    try {
      await page.evaluate(async () => {
        if (
          document.fonts &&
          document.fonts.ready
        ) {
          await document.fonts.ready;
        }
      });
    } catch (error) {
      console.warn(
        "[PDF] Font loading warning:",
        error.message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Wait For Images
    |--------------------------------------------------------------------------
    */

    console.log(
      "[PDF] Waiting for images..."
    );

    await page.evaluate(async () => {
      const images =
        Array.from(
          document.images
        );

      await Promise.all(
        images.map(
          (img) => {
            if (
              img.complete
            ) {
              return Promise.resolve();
            }

            return new Promise(
              (resolve) => {
                img.onload =
                  resolve;

                img.onerror =
                  resolve;
              }
            );
          }
        )
      );
    });

    /*
    |--------------------------------------------------------------------------
    | Small Rendering Delay
    |--------------------------------------------------------------------------
    |
    | Gives Chrome time to finish layout.
    |
    */

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          300
        )
    );

    /*
    |--------------------------------------------------------------------------
    | Verify Signature Anchor
    |--------------------------------------------------------------------------
    */

    const signatureAnchor =
      await page.$(
        "#signature-anchor"
      );

    if (
      signatureAnchor
    ) {
      console.log(
        "[SIGNATURE] #signature-anchor found."
      );
    } else {
      console.warn(
        "[SIGNATURE] #signature-anchor NOT found."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate PDF
    |--------------------------------------------------------------------------
    */

    console.log(
      "[PDF] Generating PDF..."
    );

    const generatedPdf =
      await page.pdf({
        format: "A4",

        printBackground: true,

        preferCSSPageSize: true,

        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Convert Uint8Array -> Buffer
    |--------------------------------------------------------------------------
    */

    let pdfBuffer;

    if (
      Buffer.isBuffer(
        generatedPdf
      )
    ) {
      pdfBuffer =
        generatedPdf;
    } else if (
      generatedPdf instanceof
      Uint8Array
    ) {
      pdfBuffer =
        Buffer.from(
          generatedPdf.buffer,
          generatedPdf.byteOffset,
          generatedPdf.byteLength
        );
    } else {
      pdfBuffer =
        Buffer.from(
          generatedPdf
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate PDF
    |--------------------------------------------------------------------------
    */

    console.log(
      "[PDF] Generated:",
      {
        isBuffer:
          Buffer.isBuffer(
            pdfBuffer
          ),

        length:
          pdfBuffer.length,

        header:
          pdfBuffer
            .subarray(
              0,
              5
            )
            .toString(),
      }
    );

    if (
      !Buffer.isBuffer(
        pdfBuffer
      )
    ) {
      throw new Error(
        "PDF generation failed: unable to create Buffer"
      );
    }

    if (
      pdfBuffer.length === 0
    ) {
      throw new Error(
        "PDF generation returned empty Buffer"
      );
    }

    if (
      pdfBuffer
        .subarray(
          0,
          5
        )
        .toString() !==
      "%PDF-"
    ) {
      throw new Error(
        "Generated data is not a valid PDF"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Return browser + page.
    |
    | They must remain alive until digitallySignPdf()
    | has finished.
    |
    */

    return {
      pdfBuffer,
      browser,
      page,
    };

  } catch (error) {

    /*
    |--------------------------------------------------------------------------
    | Close Browser On Error
    |--------------------------------------------------------------------------
    */

    if (browser) {
      try {
        await browser.close();
      } catch (
        closeError
      ) {
        console.error(
          "[PDF] Browser close error:",
          closeError.message
        );
      }
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Load Dhule Logo
|--------------------------------------------------------------------------
*/

async function getSidebarLogoBase64() {
  const logoPath =
    path.join(
      __dirname,
      "dhule-logo.png"
    );

  try {
    const buf =
      await fs.readFile(
        logoPath
      );

    if (
      !buf ||
      buf.length === 0
    ) {
      return "";
    }

    console.log(
      "[LOGO] Dhule logo loaded:",
      logoPath
    );

    return `data:image/png;base64,${buf.toString(
      "base64"
    )}`;

  } catch (error) {

    console.error(
      "[LOGO] Failed to load Dhule logo:",
      error.message
    );

    return "";
  }
}

/*
|--------------------------------------------------------------------------
| Render Notice HTML
|--------------------------------------------------------------------------
*/

async function renderNoticeHtmlService(
  data = {}
) {
  let templateContent =
    await fs.readFile(
      TEMPLATE_PATH,
      "utf-8"
    );

  /*
  |--------------------------------------------------------------------------
  | Corporation
  |--------------------------------------------------------------------------
  */

  const corpId =
    data.corporationId ||
    data.corpId ||
    data.ulbId ||
    data.num_illegalhoard_ulbid ||
    data.NUM_ILLEGALHOARD_ULBID ||
    4;

  let corpInfo = null;

  if (corpId) {
    try {
      corpInfo =
        await repoGetCorporationInfo(
          corpId
        );

    } catch (err) {

      console.error(
        "Error fetching corporation info:",
        err.message
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Logo
  |--------------------------------------------------------------------------
  */

  const sidebarLogoBase64 =
    await getSidebarLogoBase64();

  /*
  |--------------------------------------------------------------------------
  | Corporation Name
  |--------------------------------------------------------------------------
  */

  const corpNameValue =
    data.corporationName ||
    data.corporation_name ||
    corpInfo?.corporationName ||
    "धुळे महानगरपालिका";

  /*
  |--------------------------------------------------------------------------
  | Size
  |--------------------------------------------------------------------------
  */

  const sizeValue =
    data.SIZE || "";

  /*
  |--------------------------------------------------------------------------
  | Date Formatter
  |--------------------------------------------------------------------------
  */

  const formatDate = (
    dateValue
  ) => {

    if (!dateValue) {
      return "";
    }

    const date =
      new Date(
        dateValue
      );

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return String(
        dateValue
      );
    }

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const year =
      date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  /*
  |--------------------------------------------------------------------------
  | Notice Date
  |--------------------------------------------------------------------------
  */

  const noticeDate =
    data.NOTICE_DATE ||
    formatDate(
      data.SYSTEM_DATE ||
      data.system_date
    );

  /*
  |--------------------------------------------------------------------------
  | Replacements
  |--------------------------------------------------------------------------
  */

  const replacements = {

    corporationLogo:
      sidebarLogoBase64,

    corporationName:
      corpNameValue,

    REGIONAL_OFFICE_NO:
      data.REGIONAL_OFFICE_NO ||
      data.regional_office_no ||
      data.regionalOfficeNo ||
      data.NUM_ILLEGALHOARD_ULBID ||
      data.num_illegalhoard_ulbid ||
      "",

    ADVERTISER_NAME:
      data.ADVERTISER_NAME ||
      data.advertiser_name ||
      data.advertiserName ||
      data.VAR_ADVERTISER_NAME ||
      data.var_advertiser_name ||
      data.VAR_MARATHI_USERNAME ||
      data.var_marathi_username ||
      "",

    ADDRESS:
      data.ADDRESS ||
      data.address ||
      data.VAR_ILLEGALHOARD_ADD ||
      data.var_illegalhoard_add ||
      "",

    LATITUDE:
      data.LATITUDE ||
      data.latitude ||
      "",

    LONGITUDE:
      data.LONGITUDE ||
      data.longitude ||
      "",

    SIZE:
      sizeValue,

    TO_DATE:
      data.FROM_DATE ||
      data.from_date ||
      data.fromDate ||
      data.DAT_FROM_DT ||
      data.dat_from_dt
        ? formatDate(
            data.FROM_DATE ||
              data.from_date ||
              data.fromDate ||
              data.DAT_FROM_DT ||
              data.dat_from_dt
          )
        : "",

    FROM_DATE:
      data.TO_DATE ||
      data.to_date ||
      data.toDate ||
      data.DAT_TO_DT ||
      data.dat_to_dt
        ? formatDate(
            data.TO_DATE ||
              data.to_date ||
              data.toDate ||
              data.DAT_TO_DT ||
              data.dat_to_dt
          )
        : "",

    AMOUNT:
      data.AMOUNT_DATA || "",

    OFFICER_NAME:
      data.OFFICER_NAME ||
      data.officer_name ||
      data.officerName ||
      data.VAR_USER1 ||
      data.var_user1 ||
      "",

    OFFICER_DESIGNATION:
      data.OFFICER_DESIGNATION ||
      data.officer_designation ||
      data.VAR_OFFICER_DIVISION ||
      data.var_officer_division ||
      "सहाय्यक आयुक्त",

    REGIONAL_OFFICE:
      data.REGIONAL_OFFICE ||
      data.regional_office ||
      data.regionalOffice ||
      data.VAR_ILLEGALHOARD_WARD ||
      data.var_illegalhoard_ward ||
      "",

    NOTICE_NO:
      data.NOTICE_NO ||
      data.notice_no ||
      "",

    NOTICE_DATE:
      noticeDate,

    ZONAL_NAME:
      data.ZONAL_NAME ||
      data.zonal_name ||
      data.VAR_OFFICER_DIVISION ||
      data.var_officer_division ||
      "",

      CURRENT_DATE_TIME: data.CURRENT_DATE_TIME
  };

  /*
  |--------------------------------------------------------------------------
  | Replace Variables
  |--------------------------------------------------------------------------
  */

  Object.entries(
    replacements
  ).forEach(
    ([key, val]) => {

      const regex =
        new RegExp(
          `\\{\\{\\s*${key}\\s*\\}\\}`,
          "g"
        );

      templateContent =
        templateContent.replace(
          regex,
          val !== null &&
            val !== undefined
            ? String(val)
            : ""
        );
    }
  );

  return templateContent;
}

/*
|--------------------------------------------------------------------------
| Get Notice By ID
|--------------------------------------------------------------------------
*/

async function getNoticeByIdService(
  id
) {
  const dbData =
    await repoGetNoticeById(
      id
    );

  const data =
    dbData || {};

  const html =
    await renderNoticeHtmlService(
      data
    );

  return {
    data,
    html,
  };
}

/*
|--------------------------------------------------------------------------
| Generate Notice
|--------------------------------------------------------------------------
*/

async function generateNoticeService(
  payload
) {
  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  if (!payload) {
    throw new Error(
      "Request payload is required"
    );
  }

  const userId =
    payload.userId;

  const ulbId =
    payload.ULB_ID ||
    payload.ulbId ||
    payload.corporationId;

  const panchanamaNo =
    payload.PANCHANAMA_NO ||
    payload.panchanamaNo ||
    payload.VAR_ILLEGALHOARD_PANCHANAMA_NO;

  if (!panchanamaNo) {
    throw new Error(
      "Panchanama number is required"
    );
  }

  if (!ulbId) {
    throw new Error(
      "ULB ID is required"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Oracle Procedure
  |--------------------------------------------------------------------------
  */

  const procResult =
    await repoGenerateNotice({
      userId,

      ulbId,

      PANCHANAMA_NO:
        panchanamaNo,
    });

  const errorCode =
    procResult.errorCode;

  if (
    errorCode !== null &&
    errorCode !== undefined &&
    Number(errorCode) !== 9999
  ) {
    throw new Error(
      procResult.errorMessage ||
        "Notice generation procedure failed"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Procedure Data
  |--------------------------------------------------------------------------
  */

  const noticeData =
    procResult.noticeData ||
    {};

  /*
  |--------------------------------------------------------------------------
  | Merge Data
  |--------------------------------------------------------------------------
  */

  const getCurrentDateTime = () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const year = now.getFullYear();

  let hours = now.getHours();

  const minutes = String(now.getMinutes()).padStart(2, "0");

  const seconds = String(now.getSeconds()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;

  hours = hours || 12;

  hours = String(hours).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}`;
};

const mergedData = {
  ...payload,

  id:
    noticeData.id ||
    payload.id ||
    null,

  ADDRESS:
    noticeData.address ||
    payload.ADDRESS ||
    "-",

  REGIONAL_OFFICE_NO:
    noticeData.ward ||
    payload.REGIONAL_OFFICE_NO ||
    "-",

  ADVERTISER_NAME:
    payload.ADVERTISER_NAME ||
    "-",

  AMOUNT_DATA:
    noticeData.amount ||
    payload.AMOUNT ||
    "0",

  LATITUDE:
    noticeData.latitude ||
    payload.LATITUDE ||
    "-",

  LONGITUDE:
    noticeData.longitude ||
    payload.LONGITUDE ||
    "-",

  SIZE:
    noticeData.length &&
    noticeData.width
      ? `${noticeData.length} x ${noticeData.width}`
      : payload.SIZE || "-",

  PANCHANAMA_NO:
    noticeData.panchanamaNo ||
    panchanamaNo,

  NOTICE_NO:
    noticeData.noticeNo ||
    "-",

  FROM_DATE:
    noticeData.toDate ||
    payload.TO_DATE ||
    "-",

  TO_DATE:
    noticeData.fromDate ||
    payload.FROM_DATE ||
    "-",

  REGIONAL_OFFICE:
    noticeData.ward ||
    payload.REGIONAL_OFFICE ||
    "-",

  NOTICE_DATE:
    noticeData.noticeDate ||
    payload.NOTICE_DATE ||
    "-",

  ZONAL_NAME:
    noticeData.zonalName ||
    payload.ZONAL_NAME ||
    "-",

  // ==========================================
  // CURRENT DATE + TIME
  // ==========================================
  CURRENT_DATE_TIME:
    getCurrentDateTime(),
};

  /*
  |--------------------------------------------------------------------------
  | Generate HTML
  |--------------------------------------------------------------------------
  */

  const html =
    await renderNoticeHtmlService(
      mergedData
    );

  /*
  |--------------------------------------------------------------------------
  | Generate PDF
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | generatePdfFromHtml returns browser + page.
  |
  */

  let browser = null;

  try {

    const result =
      await generatePdfFromHtml(
        html
      );

    const pdfBuffer =
      result.pdfBuffer;

    const page =
      result.page;

    browser =
      result.browser;

    /*
    |--------------------------------------------------------------------------
    | Verify PDF
    |--------------------------------------------------------------------------
    */

    console.log(
      "[NOTICE] Generated PDF:",
      {
        isBuffer:
          Buffer.isBuffer(
            pdfBuffer
          ),

        constructor:
          pdfBuffer?.constructor
            ?.name,

        length:
          pdfBuffer?.length,

        header:
          pdfBuffer
            ?.subarray(
              0,
              5
            )
            ?.toString(),
      }
    );

    if (
      !Buffer.isBuffer(
        pdfBuffer
      )
    ) {
      throw new Error(
        "PDF generation failed: result is not a Buffer"
      );
    }

    if (
      pdfBuffer.length === 0
    ) {
      throw new Error(
        "PDF generation failed: empty PDF"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | GLOBAL DIGITAL SIGNATURE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Do NOT close browser before this function.
    |
    | digitallySignPdf() uses Puppeteer page
    | to detect #signature-anchor.
    |
    */

    console.log(
      "[SIGNATURE] Starting global digital signature..."
    );

    const signedResult =
      await digitallySignPdf({
        pdfBuffer,

        page,

        pfxPath:
          path.join(
            __dirname,
            "DS Dhule Municipal Corporation.pfx"
          ),

        password:
          "Pro452",

        selector:
          "#signature-anchor",
      });

    /*
    |--------------------------------------------------------------------------
    | Final Signed PDF
    |--------------------------------------------------------------------------
    */

    let signedPdfBuffer =
      signedResult.pdfBuffer;

    /*
    |--------------------------------------------------------------------------
    | Ensure Buffer
    |--------------------------------------------------------------------------
    */

    if (
      !Buffer.isBuffer(
        signedPdfBuffer
      )
    ) {

      if (
        signedPdfBuffer instanceof
        Uint8Array
      ) {

        signedPdfBuffer =
          Buffer.from(
            signedPdfBuffer.buffer,
            signedPdfBuffer.byteOffset,
            signedPdfBuffer.byteLength
          );

      } else {

        signedPdfBuffer =
          Buffer.from(
            signedPdfBuffer
          );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Signed PDF
    |--------------------------------------------------------------------------
    */

    console.log(
      "[SIGNATURE] Signed Notice PDF:",
      {
        isBuffer:
          Buffer.isBuffer(
            signedPdfBuffer
          ),

        length:
          signedPdfBuffer?.length,

        signerName:
          signedResult.signerName,

        pageNumber:
          signedResult.pageNumber,

        widgetRect:
          signedResult.widgetRect,
      }
    );

    if (
      !Buffer.isBuffer(
        signedPdfBuffer
      )
    ) {
      throw new Error(
        "PDF signing failed: result is not a Buffer"
      );
    }

    if (
      signedPdfBuffer.length === 0
    ) {
      throw new Error(
        "PDF signing failed: empty signed PDF"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Return Signed PDF
    |--------------------------------------------------------------------------
    */

    return signedPdfBuffer;

  } finally {

    /*
    |--------------------------------------------------------------------------
    | Close Browser AFTER signing
    |--------------------------------------------------------------------------
    */

    if (browser) {

      try {

        await browser.close();

        console.log(
          "[PUPPETEER] Browser closed."
        );

      } catch (
        closeError
      ) {

        console.error(
          "[PUPPETEER] Browser close error:",
          closeError.message
        );
      }
    }
  }
}

/*
|--------------------------------------------------------------------------
| Module Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  renderNoticeHtmlService,
  getNoticeByIdService,
  generateNoticeService,
};