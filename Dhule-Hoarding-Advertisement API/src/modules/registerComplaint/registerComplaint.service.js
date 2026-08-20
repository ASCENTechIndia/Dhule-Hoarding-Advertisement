const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

const { SignPdf } = require("@signpdf/signpdf");
const { P12Signer } = require("@signpdf/signer-p12");
const { PDFDocument } = require("pdf-lib");
const puppeteer = require("puppeteer");

const { PDF_RENDER_OPTIONS } = require("../../utils/shared-pdf-options");

const {
  repoWardList,
  repoToiletList,
  repoComplaintTypeList,
  regComplaintRepo,
  assignComplaintRepo,
  compListRepo,
  repoSupervisorList,
  repoVendorList,
  regParticipantRepo,
  getPanchanamalistRepo,
  illegalHoardRepo,
  getPanchanamaDetailsRepo,
} = require("./registerComplaint.repo");

const {
  signPdf,
  extractSignerNameFromPfx,
} = require("./signatureHelpers");

const { locateSignatureWidget } = require("./SignaturePlacement");

const TEMPLATE_PATH = path.join(
  __dirname,
  "panchanama.template.html"
);

/*
|--------------------------------------------------------------------------
| SERVER CHROME PATH
|--------------------------------------------------------------------------
|
| Puppeteer cache:
|
| C:\inetpub\wwwroot\Dhule-Advertisement\Backend\
| node_modules\puppeteer\.cache\puppeteer\chrome
|
| We automatically find chrome.exe inside this folder.
|
*/

const CHROME_CACHE_PATH =
  "C:\\inetpub\\wwwroot\\Dhule-Advertisement\\Backend\\node_modules\\puppeteer\\.cache\\puppeteer\\chrome";

/*
|--------------------------------------------------------------------------
| Find Chrome executable
|--------------------------------------------------------------------------
*/

function findChromeExecutable() {
  if (!fsSync.existsSync(CHROME_CACHE_PATH)) {
    throw new Error(
      `Puppeteer Chrome cache folder not found:\n${CHROME_CACHE_PATH}`
    );
  }

  function searchDirectory(directory) {
    const entries = fsSync.readdirSync(directory, {
      withFileTypes: true,
    });

    // First check files
    for (const entry of entries) {
      if (
        entry.isFile() &&
        entry.name.toLowerCase() === "chrome.exe"
      ) {
        return path.join(directory, entry.name);
      }
    }

    // Then search subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const result = searchDirectory(
          path.join(directory, entry.name)
        );

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  const chromePath = searchDirectory(CHROME_CACHE_PATH);

  if (!chromePath) {
    throw new Error(
      `chrome.exe not found inside:\n${CHROME_CACHE_PATH}`
    );
  }

  console.log("Chrome executable found:", chromePath);

  return chromePath;
}

/*
|--------------------------------------------------------------------------
| Launch Puppeteer
|--------------------------------------------------------------------------
*/

async function launchChrome() {
  const executablePath = findChromeExecutable();

  console.log("Launching Chrome:", executablePath);

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

/*
|--------------------------------------------------------------------------
| Basic Services
|--------------------------------------------------------------------------
*/

async function serviceWardList(ulbid) {
  return repoWardList(ulbid);
}

async function serviceVendorList(ulbid) {
  return repoVendorList(ulbid);
}

async function serviceToiletList(ulbid, wardid) {
  return repoToiletList(ulbid, wardid);
}

async function serviceComplaintTypeList(ulbid) {
  return repoComplaintTypeList(ulbid);
}

async function regComplaintService(payload) {
  return regComplaintRepo(payload);
}

async function assignComplaintService(payload) {
  return assignComplaintRepo(payload);
}

async function compListService(
  si_id,
  ulbid,
  fromDate,
  toDate,
  status,
  page,
  limit
) {
  return compListRepo(
    si_id,
    ulbid,
    fromDate,
    toDate,
    status,
    page,
    limit
  );
}

async function serviceSupervisorList(ulbid) {
  return repoSupervisorList(ulbid);
}

async function regParticipantService(payload) {
  return regParticipantRepo(payload);
}

async function getPanchanamalistService(
  fromDate,
  toDate,
  page,
  limit,
  ulbId,
  userId
) {
  return getPanchanamalistRepo(
    fromDate,
    toDate,
    page,
    limit,
    ulbId,
    userId
  );
}

async function illegalHoardService(payload) {
  return illegalHoardRepo(payload);
}

async function getPanchanamaDetailsService(id) {
  return getPanchanamaDetailsRepo(id);
}

/*
|--------------------------------------------------------------------------
| Date Formatting
|--------------------------------------------------------------------------
*/

function formatPanchanamaDateTime(dateStr) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/*
|--------------------------------------------------------------------------
| Details Rows
|--------------------------------------------------------------------------
*/

function buildDetailsRows(details) {
  if (!details || details.length === 0) {
    return `
      <tr>
        <td colspan="3" class="no-data">
          कोणतेही कर्मचारी नाहीत.
        </td>
      </tr>
    `;
  }

  return details
    .map(
      (item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.VAR_USER || "-"}</td>
          <td>${item.VAR_USER_POST || "-"}</td>
        </tr>
      `
    )
    .join("");
}

/*
|--------------------------------------------------------------------------
| Demolition Rows
|--------------------------------------------------------------------------
*/

function buildDemolitionRows(demolitionDetails) {
  if (!demolitionDetails || demolitionDetails.length === 0) {
    return `
      <tr>
        <td colspan="2" class="no-data">
          कोणतीही माहिती नाही.
        </td>
      </tr>
    `;
  }

  return demolitionDetails
    .map(
      (item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.VAR_DEMONSTARTED_NAME || "-"}</td>
        </tr>
      `
    )
    .join("");
}

/*
|--------------------------------------------------------------------------
| Photo Grid
|--------------------------------------------------------------------------
*/

function buildPhotoGrid(master) {
  const photos = [
    master.BLOB_NEAR_PHOTO,
    master.BLOB_FAR_PHOTO,
    master.BLOB_USER_PHOTO,
  ].filter(
    (img) =>
      img &&
      typeof img === "string" &&
      img.trim() !== ""
  );

  if (photos.length === 0) {
    return `
      <div class="no-data">
        फोटो उपलब्ध नाहीत.
      </div>
    `;
  }

  const labels = [
    "जवळून फोटो",
    "दुरून फोटो",
    "पंचनामा करणाऱ्यासोबत फोटो",
  ];

  return photos
    .map(
      (base64, idx) => `
        <div class="photo-item">
          <img
            src="data:image/jpeg;base64,${base64}"
            alt="${labels[idx] || "फोटो"}"
          />

          <span class="photo-label">
            ${labels[idx] || "फोटो"}
          </span>
        </div>
      `
    )
    .join("");
}

/*
|--------------------------------------------------------------------------
| Render Panchanama HTML
|--------------------------------------------------------------------------
*/

async function renderPanchanamaHtml(data = {}) {
  const master = data.master || {};
  const details = data.details || [];
  const demolitionDetails =
    data.demolitionDetails || [];

  let templateContent = await fs.readFile(
    TEMPLATE_PATH,
    "utf-8"
  );

  const captureDateTime =
    formatPanchanamaDateTime(
      master.DAT_CAP_DT
    );

  const detailsRows =
    buildDetailsRows(details);

  const demolitionRows =
    buildDemolitionRows(
      demolitionDetails
    );

  const photoGrid =
    buildPhotoGrid(master);

  /*
  |--------------------------------------------------------------------------
  | Corporation Logo
  |--------------------------------------------------------------------------
  */

  const logoPath = path.join(
    __dirname,
    "../../img/dhule-logo.png"
  );

  const logoBuffer = await fs.readFile(
    logoPath
  );

  const logoBase64 =
    `data:image/png;base64,${logoBuffer.toString("base64")}`;

  /*
  |--------------------------------------------------------------------------
  | Current Date
  |--------------------------------------------------------------------------
  */

  const currentDate = new Date()
    .toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
    })
    .replace(/\//g, "-");

  /*
  |--------------------------------------------------------------------------
  | Replacement Map
  |--------------------------------------------------------------------------
  */

  const replacements = {
    VAR_ILLEGALHOARD_PANCHANAMA_NO:
      master.VAR_ILLEGALHOARD_PANCHANAMA_NO || "-",

    CAPTURE_DATE_TIME:
      captureDateTime,

    VAR_USER1:
      master.VAR_USER1 || "-",

    VAR_USER1_POST:
      master.VAR_USER1_POST || "-",

    VAR_ILLEGALHOARD_ADD:
      master.VAR_ILLEGALHOARD_ADD || "-",

    VAR_ILLEGALHOARD_WARD:
      master.VAR_ILLEGALHOARD_WARD || "-",

    NUM_SIZE_LENGTH:
      master.NUM_SIZE_LENGTH || "-",

    NUM_SIZE_WIDTH:
      master.NUM_SIZE_WIDTH || "-",

    DAT_FROM_DT: master.DAT_FROM_DT
      ? new Date(
          master.DAT_FROM_DT
        ).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      : "-",

    DETAILS_ROWS:
      detailsRows,

    DEMOLITION_ROWS:
      demolitionRows,

    PHOTO_GRID:
      photoGrid,

    OFFICER_NAME:
      master.VAR_USER1 || "-",

    OFFICER_POST:
      master.VAR_USER1_POST || "-",

    REGIONAL_OFFICE:
      master.VAR_ILLEGALHOARD_WARD || "-",

    CORPORATION_LOGO:
      logoBase64,

    CURRENT_DATE:
      currentDate,

    CAPTURE_TIME:
      master.VAR_CAP_TIME || "-",
  };

  /*
  |--------------------------------------------------------------------------
  | Replace Template Variables
  |--------------------------------------------------------------------------
  */

  Object.entries(replacements).forEach(
    ([key, value]) => {
      const regex = new RegExp(
        `\\{\\{\\s*${key}\\s*\\}\\}`,
        "g"
      );

      templateContent =
        templateContent.replace(
          regex,
          String(value)
        );
    }
  );

  return templateContent;
}

/*
|--------------------------------------------------------------------------
| Generate Panchanama PDF
|--------------------------------------------------------------------------
*/

async function generatePanchnamaPdfService(id) {
  let browser = null;

  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Fetch Panchanama Data
    |--------------------------------------------------------------------------
    */

    console.log(
      "Generating Panchanama PDF for ID:",
      id
    );

    const result =
      await getPanchanamaDetailsRepo(id);

    if (
      !result ||
      !result.master
    ) {
      throw new Error(
        "Panchanama data not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Generate HTML
    |--------------------------------------------------------------------------
    */

    const html =
      await renderPanchanamaHtml(
        result
      );

    /*
    |--------------------------------------------------------------------------
    | 3. Launch Server Chrome
    |--------------------------------------------------------------------------
    */

    browser =
      await launchChrome();

    const page =
      await browser.newPage();

    /*
    |--------------------------------------------------------------------------
    | A4 viewport
    |--------------------------------------------------------------------------
    */

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    /*
    |--------------------------------------------------------------------------
    | 4. Load HTML
    |--------------------------------------------------------------------------
    */

    await page.setContent(
      html,
      {
        waitUntil: "networkidle0",
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Wait for images
    |--------------------------------------------------------------------------
    */

    await page.evaluate(async () => {
      const images =
        Array.from(
          document.images
        );

      await Promise.all(
        images.map((img) => {
          if (img.complete) {
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
        })
      );
    });

    /*
    |--------------------------------------------------------------------------
    | 5. Detect Signature Anchor
    |--------------------------------------------------------------------------
    */

    let placement = null;

    try {
      placement =
        await locateSignatureWidget(
          page
        );

      console.log(
        "Signature placement detected:",
        placement
      );
    } catch (e) {
      console.warn(
        "Signature placement detection failed:",
        e.message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Generate Clean PDF
    |--------------------------------------------------------------------------
    */

    const pdfBuffer =
      await page.pdf(
        PDF_RENDER_OPTIONS
      );

    /*
    |--------------------------------------------------------------------------
    | 7. Close Browser
    |--------------------------------------------------------------------------
    */

    await browser.close();
    browser = null;

    /*
    |--------------------------------------------------------------------------
    | 8. Get PDF Page Count
    |--------------------------------------------------------------------------
    */

    const pdfDoc =
      await PDFDocument.load(
        pdfBuffer
      );

    const pageCount =
      pdfDoc.getPageCount();

    if (!pageCount) {
      throw new Error(
        "Generated PDF has no pages"
      );
    }

    const lastPage =
      pageCount;

    /*
    |--------------------------------------------------------------------------
    | 9. Signature Widget Position
    |--------------------------------------------------------------------------
    */

    let pageNumber;
    let widgetRect;

    if (
      placement &&
      placement.widgetRect &&
      placement.pageNumber
    ) {
      let [
        x1,
        y1,
        x2,
        y2,
      ] =
        placement.widgetRect;

      /*
      |--------------------------------------------------------------------------
      | Signature Box Size
      |--------------------------------------------------------------------------
      */

      const boxWidth = 240;
      const boxHeight = 100;

      const centerX =
        (x1 + x2) / 2;

      const centerY =
        (y1 + y2) / 2;

      /*
      |--------------------------------------------------------------------------
      | Center Signature Box
      |--------------------------------------------------------------------------
      */

      x1 = Math.max(
        0,
        Math.round(
          centerX -
            boxWidth / 2
        )
      );

      y1 = Math.max(
        0,
        Math.round(
          centerY -
            boxHeight / 2
        )
      );

      /*
      |--------------------------------------------------------------------------
      | A4 PDF = 595 x 842 points
      |--------------------------------------------------------------------------
      */

      x1 = Math.min(
        x1,
        595 - boxWidth
      );

      y1 = Math.min(
        y1,
        842 - boxHeight
      );

      x2 =
        x1 + boxWidth;

      y2 =
        y1 + boxHeight;

      widgetRect = [
        x1,
        y1,
        x2,
        y2,
      ];

      pageNumber =
        placement.pageNumber;
    } else {
      /*
      |--------------------------------------------------------------------------
      | Fallback Position
      |--------------------------------------------------------------------------
      */

      const boxWidth = 240;
      const boxHeight = 100;

      const marginFromBottom = 160;

      const x1 =
        (595 - boxWidth) /
        2;

      const y1 =
        marginFromBottom;

      const x2 =
        x1 + boxWidth;

      const y2 =
        y1 + boxHeight;

      widgetRect = [
        Math.round(x1),
        Math.round(y1),
        Math.round(x2),
        Math.round(y2),
      ];

      pageNumber =
        lastPage;
    }

    console.log(
      "Final signature position:",
      {
        pageNumber,
        widgetRect,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | 10. PFX Credentials
    |--------------------------------------------------------------------------
    */

    const pfxPath =
      path.join(
        __dirname,
        "DS Dhule Municipal Corporation.pfx"
      );

    const pfxPassword =
      "Pro452";

    /*
    |--------------------------------------------------------------------------
    | Validate PFX
    |--------------------------------------------------------------------------
    */

    try {
      await fs.access(
        pfxPath
      );
    } catch {
      throw new Error(
        `PFX file not found:\n${pfxPath}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 11. Sign PDF
    |--------------------------------------------------------------------------
    */

    const signerName =
      extractSignerNameFromPfx(
        pfxPath,
        pfxPassword
      );

    console.log(
      "Signing PDF with:",
      signerName
    );

    const signedPdf =
      await signPdf(
        pdfBuffer,
        pfxPath,
        pfxPassword,
        pageNumber,
        widgetRect,
        signerName
      );

    console.log(
      "Panchanama PDF generated and signed successfully."
    );

    return signedPdf;
  } catch (error) {
    console.error(
      "generatePanchnamaPdfService ERROR:",
      error
    );

    throw error;
  } finally {
    /*
    |--------------------------------------------------------------------------
    | Always close browser
    |--------------------------------------------------------------------------
    */

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error(
          "Browser close error:",
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
  serviceWardList,
  serviceToiletList,
  serviceComplaintTypeList,
  regComplaintService,
  assignComplaintService,
  compListService,
  serviceSupervisorList,
  serviceVendorList,
  regParticipantService,
  getPanchanamalistService,
  illegalHoardService,
  getPanchanamaDetailsService,
  generatePanchnamaPdfService,
};