const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

const puppeteer = require("puppeteer");

const {
  digitallySignPdf,
} = require("../../utils/digitalSignature");

const {
  PDF_RENDER_OPTIONS,
} = require("../../utils/shared-pdf-options");

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

const TEMPLATE_PATH = path.join(
  __dirname,
  "panchanama.template.html"
);

function findChromeExecutable() {
  const possiblePaths = [
    // Google Chrome - Windows

      // Chrome on your IIS production server
    "C:\\inetpub\\wwwroot\\Dhule-Advertisement\\Backend\\node_modules\\puppeteer\\.cache\\puppeteer\\chrome",

    
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


async function serviceWardList(
  ulbid
) {
  return repoWardList(
    ulbid
  );
}

async function serviceVendorList(
  ulbid
) {
  return repoVendorList(
    ulbid
  );
}

async function serviceToiletList(
  ulbid,
  wardid
) {
  return repoToiletList(
    ulbid,
    wardid
  );
}

async function serviceComplaintTypeList(
  ulbid
) {
  return repoComplaintTypeList(
    ulbid
  );
}

async function regComplaintService(
  payload
) {
  return regComplaintRepo(
    payload
  );
}

async function assignComplaintService(
  payload
) {
  return assignComplaintRepo(
    payload
  );
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

async function serviceSupervisorList(
  ulbid
) {
  return repoSupervisorList(
    ulbid
  );
}

async function regParticipantService(
  payload
) {
  return regParticipantRepo(
    payload
  );
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

async function illegalHoardService(
  payload
) {
  return illegalHoardRepo(
    payload
  );
}

async function getPanchanamaDetailsService(
  id
) {
  return getPanchanamaDetailsRepo(
    id
  );
}

/*
|--------------------------------------------------------------------------
| Date Formatting
|--------------------------------------------------------------------------
*/

function formatPanchanamaDateTime(
  dateStr
) {
  if (!dateStr) {
    return "-";
  }

  const date =
    new Date(dateStr);

  if (
    isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const year =
    date.getFullYear();

  return `${day}/${month}/${year}`;
}

/*
|--------------------------------------------------------------------------
| Details Rows
|--------------------------------------------------------------------------
*/

function buildDetailsRows(
  details
) {
  if (
    !details ||
    details.length === 0
  ) {
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
      (
        item,
        idx
      ) => `
        <tr>
          <td>${idx + 1}</td>

          <td>
            ${item.VAR_USER || "-"}
          </td>

          <td>
            ${item.VAR_USER_POST || "-"}
          </td>
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

function buildDemolitionRows(
  demolitionDetails
) {
  if (
    !demolitionDetails ||
    demolitionDetails.length === 0
  ) {
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
      (
        item,
        idx
      ) => `
        <tr>
          <td>${idx + 1}</td>

          <td>
            ${
              item.VAR_DEMONSTARTED_NAME ||
              "-"
            }
          </td>
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

function buildPhotoGrid(
  master
) {
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

  if (
    photos.length === 0
  ) {
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
      (
        base64,
        idx
      ) => `
        <div class="photo-item">

          <img
            src="data:image/jpeg;base64,${base64}"
            alt="${
              labels[idx] ||
              "फोटो"
            }"
          />

          <span class="photo-label">
            ${
              labels[idx] ||
              "फोटो"
            }
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

async function renderPanchanamaHtml(
  data = {}
) {
  const master =
    data.master || {};

  const details =
    data.details || [];

  const demolitionDetails =
    data.demolitionDetails || [];

  /*
  |--------------------------------------------------------------------------
  | Read HTML Template
  |--------------------------------------------------------------------------
  */

  let templateContent =
    await fs.readFile(
      TEMPLATE_PATH,
      "utf-8"
    );

  /*
  |--------------------------------------------------------------------------
  | Capture Date
  |--------------------------------------------------------------------------
  */

  const captureDateTime =
    formatPanchanamaDateTime(
      master.DAT_CAP_DT
    );

  /*
  |--------------------------------------------------------------------------
  | Build Rows
  |--------------------------------------------------------------------------
  */

  const detailsRows =
    buildDetailsRows(
      details
    );

  const demolitionRows =
    buildDemolitionRows(
      demolitionDetails
    );

  /*
  |--------------------------------------------------------------------------
  | Photos
  |--------------------------------------------------------------------------
  */

  const photoGrid =
    buildPhotoGrid(
      master
    );

  /*
  |--------------------------------------------------------------------------
  | Corporation Logo
  |--------------------------------------------------------------------------
  */

  const logoPath =
    path.join(
      __dirname,
      "../../img/dhule-logo.png"
    );

  const logoBuffer =
    await fs.readFile(
      logoPath
    );

  const logoBase64 =
    `data:image/png;base64,${logoBuffer.toString(
      "base64"
    )}`;

  /*
  |--------------------------------------------------------------------------
  | Current Date
  |--------------------------------------------------------------------------
  */

  const currentDate =
    new Date()
      .toLocaleDateString(
        "en-GB",
        {
          timeZone:
            "Asia/Kolkata",
        }
      )
      .replace(
        /\//g,
        "-"
      );

  /*
  |--------------------------------------------------------------------------
  | Replacement Map
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

  const replacements = {

    VAR_ILLEGALHOARD_PANCHANAMA_NO:
      master.VAR_ILLEGALHOARD_PANCHANAMA_NO ||
      "-",

    CAPTURE_DATE_TIME:
      captureDateTime,

    VAR_USER1:
      master.VAR_USER1 ||
      "-",

    VAR_USER1_POST:
      master.VAR_USER1_POST ||
      "-",

    VAR_ILLEGALHOARD_ADD:
      master.VAR_ILLEGALHOARD_ADD ||
      "-",

    VAR_ILLEGALHOARD_WARD:
      master.VAR_ILLEGALHOARD_WARD ||
      "-",

    NUM_SIZE_LENGTH:
      master.NUM_SIZE_LENGTH ||
      "-",

    NUM_SIZE_WIDTH:
      master.NUM_SIZE_WIDTH ||
      "-",

    DAT_FROM_DT:
      master.DAT_FROM_DT
        ? new Date(
            master.DAT_FROM_DT
          ).toLocaleDateString(
            "en-IN",
            {
              timeZone:
                "Asia/Kolkata",
            }
          )
        : "-",

    DETAILS_ROWS:
      detailsRows,

    DEMOLITION_ROWS:
      demolitionRows,

    PHOTO_GRID:
      photoGrid,

    OFFICER_NAME:
      master.VAR_USER1 ||
      "-",

    OFFICER_POST:
      master.VAR_USER1_POST ||
      "-",

    REGIONAL_OFFICE:
      master.VAR_ILLEGALHOARD_WARD ||
      "-",

    CORPORATION_LOGO:
      logoBase64,

    CURRENT_DATE:
      currentDate,

    CAPTURE_TIME:
      master.VAR_CAP_TIME ||
      "-",
      CURRENT_DATE_TIME: getCurrentDateTime()
      
  };

  /*
  |--------------------------------------------------------------------------
  | Replace Template Variables
  |--------------------------------------------------------------------------
  */

  Object.entries(
    replacements
  ).forEach(
    (
      [
        key,
        value,
      ]
    ) => {

      const regex =
        new RegExp(
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

async function generatePanchnamaPdfService(
  id
) {
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
      await getPanchanamaDetailsRepo(
        id
      );

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
    | 3. Launch Chrome
    |--------------------------------------------------------------------------
    */

    browser =
      await launchChrome();

    const page =
      await browser.newPage();

    /*
    |--------------------------------------------------------------------------
    | 4. A4 Viewport
    |--------------------------------------------------------------------------
    */

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    /*
    |--------------------------------------------------------------------------
    | 5. Load HTML
    |--------------------------------------------------------------------------
    */

  await page.setContent(html, {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});

    /*
    |--------------------------------------------------------------------------
    | 6. Wait for Images
    |--------------------------------------------------------------------------
    */

    await page.evaluate(
      async () => {

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

      }
    );

    /*
    |--------------------------------------------------------------------------
    | 7. Verify Signature Anchor
    |--------------------------------------------------------------------------
    */

    const signatureAnchorExists =
      await page.evaluate(
        () => {

          return !!document.querySelector(
            "#signature-anchor"
          );

        }
      );

    if (
      !signatureAnchorExists
    ) {

      throw new Error(
        'Signature anchor "#signature-anchor" was not found in Panchanama HTML template.'
      );

    }

    console.log(
      'Signature anchor "#signature-anchor" found.'
    );

    /*
    |--------------------------------------------------------------------------
    | 8. Generate Clean PDF
    |--------------------------------------------------------------------------
    */

    const pdfBuffer =
      await page.pdf(
        PDF_RENDER_OPTIONS
      );

    if (
      !pdfBuffer ||
      pdfBuffer.length === 0
    ) {

      throw new Error(
        "PDF generation failed or generated PDF is empty."
      );

    }

    console.log(
      "PDF generated:",
      pdfBuffer.length
    );

    /*
    |--------------------------------------------------------------------------
    | 9. PFX Credentials
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
    | 10. Validate PFX
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

    console.log(
      "PFX found:",
      pfxPath
    );

    /*
    |--------------------------------------------------------------------------
    | 11. GLOBAL DIGITAL SIGNATURE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Keep browser/page alive here.
    |
    | digitallySignPdf() internally uses Puppeteer
    | to detect #signature-anchor.
    |
    |--------------------------------------------------------------------------
    */

    const signedResult =
      await digitallySignPdf({

        pdfBuffer,

        page,

        pfxPath,

        password:
          pfxPassword,

        selector:
          "#signature-anchor",

      });

    /*
    |--------------------------------------------------------------------------
    | 12. Validate Signed PDF
    |--------------------------------------------------------------------------
    */

    if (
      !signedResult ||
      !signedResult.pdfBuffer
    ) {

      throw new Error(
        "Digital signature failed: signed PDF buffer was not returned."
      );

    }

    const finalPdfBuffer =
      Buffer.from(
        signedResult.pdfBuffer
      );

    console.log(
      "Signed PDF:",
      finalPdfBuffer.length
    );

    /*
    |--------------------------------------------------------------------------
    | 13. Signature Information
    |--------------------------------------------------------------------------
    */

    console.log(
      "Signature information:",
      {
        signerName:
          signedResult.signerName,

        pageNumber:
          signedResult.pageNumber,

        widgetRect:
          signedResult.widgetRect,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | 14. Close Browser
    |--------------------------------------------------------------------------
    */

    await browser.close();

    browser = null;

    /*
    |--------------------------------------------------------------------------
    | 15. Return Signed PDF
    |--------------------------------------------------------------------------
    */

    console.log(
      "Panchanama PDF generated and signed successfully."
    );

    return finalPdfBuffer;

  } catch (error) {

    console.error(
      "generatePanchnamaPdfService ERROR:",
      error
    );

    throw error;

  } finally {

    /*
    |--------------------------------------------------------------------------
    | Always Close Browser
    |--------------------------------------------------------------------------
    */

    if (browser) {

      try {

        await browser.close();

      } catch (
        closeError
      ) {

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