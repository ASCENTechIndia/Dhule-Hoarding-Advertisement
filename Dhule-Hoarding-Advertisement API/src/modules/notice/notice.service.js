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
  signPdf,
  extractSignerNameFromPfx,
} = require("../registerComplaint/signatureHelpers");

const {
  locateSignatureWidget,
} = require("../registerComplaint/SignaturePlacement");

const TEMPLATE_PATH = path.join(
  __dirname,
  "notice.template.html"
);

/*
|--------------------------------------------------------------------------
| SERVER CHROME PATH
|--------------------------------------------------------------------------
*/

const CHROME_CACHE_PATH =
  "C:\\inetpub\\wwwroot\\Dhule-Advertisement\\Backend\\node_modules\\puppeteer\\.cache\\puppeteer\\chrome";

/*
|--------------------------------------------------------------------------
| Find Chrome Executable
|--------------------------------------------------------------------------
*/

function findChromeExecutable() {
  if (!fsSync.existsSync(CHROME_CACHE_PATH)) {
    throw new Error(
      `Chrome cache folder not found:\n${CHROME_CACHE_PATH}`
    );
  }

  function searchDirectory(directory) {
    const entries = fsSync.readdirSync(directory, {
      withFileTypes: true,
    });

    // Check files first
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

    // Search folders
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const result = searchDirectory(
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

  const chromePath =
    searchDirectory(
      CHROME_CACHE_PATH
    );

  if (!chromePath) {
    throw new Error(
      `chrome.exe not found inside:\n${CHROME_CACHE_PATH}`
    );
  }

  console.log(
    "Chrome executable:",
    chromePath
  );

  return chromePath;
}

/*
|--------------------------------------------------------------------------
| Launch Server Chrome
|--------------------------------------------------------------------------
*/

async function launchChrome() {
  const executablePath =
    findChromeExecutable();

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
  });
}

/*
|--------------------------------------------------------------------------
| Generate PDF From HTML
|--------------------------------------------------------------------------
|
| Returns:
|
| {
|   pdfBuffer: Buffer,
|   placement
| }
|
|--------------------------------------------------------------------------
*/

async function generatePdfFromHtml(html) {
  if (!html) {
    throw new Error(
      "HTML is required to generate PDF"
    );
  }

  let browser = null;

  try {
    browser =
      await launchChrome();

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
    | Load HTML
    |--------------------------------------------------------------------------
    */

    await page.setContent(
      html,
      {
        waitUntil: [
          "load",
          "networkidle0",
        ],
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Wait For Images
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
    | Detect Signature Placement
    |--------------------------------------------------------------------------
    */

    let placement = null;

    try {
      placement =
        await locateSignatureWidget(
          page
        );

      console.log(
        "Notice signature placement:",
        placement
      );
    } catch (error) {
      console.warn(
        "Notice signature placement detection failed:",
        error.message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate PDF
    |--------------------------------------------------------------------------
    */

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
    | IMPORTANT:
    | Puppeteer may return Uint8Array.
    | Convert explicitly to Node Buffer.
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
      "PDF Generator:",
      {
        originalType:
          generatedPdf?.constructor
            ?.name,

        originalIsBuffer:
          Buffer.isBuffer(
            generatedPdf
          ),

        finalIsBuffer:
          Buffer.isBuffer(
            pdfBuffer
          ),

        length:
          pdfBuffer.length,

        header:
          pdfBuffer
            .subarray(0, 5)
            .toString(),

        placement,
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
        .subarray(0, 5)
        .toString() !==
      "%PDF-"
    ) {
      throw new Error(
        "Generated data is not a valid PDF"
      );
    }

    return {
      pdfBuffer,
      placement,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error(
          "Chrome close error:",
          error.message
        );
      }
    }
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
      "Dhule logo loaded:",
      logoPath
    );

    return `data:image/png;base64,${buf.toString(
      "base64"
    )}`;
  } catch (error) {
    console.error(
      "Failed to load Dhule logo:",
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

  const sidebarLogoBase64 =
    await getSidebarLogoBase64();

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
      new Date(dateValue);

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
        : payload.SIZE ||
          "-",

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
  */

  const {
    pdfBuffer,
    placement,
  } =
    await generatePdfFromHtml(
      html
    );

  /*
  |--------------------------------------------------------------------------
  | Verify PDF
  |--------------------------------------------------------------------------
  */

  console.log(
    "Generated Notice PDF:",
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

      placement,
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
  | Sign PDF
  |--------------------------------------------------------------------------
  */

  const signedPdfBuffer =
    await signNoticePdf(
      pdfBuffer,
      placement
    );

  /*
  |--------------------------------------------------------------------------
  | Verify Signed PDF
  |--------------------------------------------------------------------------
  */

  console.log(
    "Signed Notice PDF:",
    {
      isBuffer:
        Buffer.isBuffer(
          signedPdfBuffer
        ),

      length:
        signedPdfBuffer?.length,
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

  return signedPdfBuffer;
}

/*
|--------------------------------------------------------------------------
| Sign Notice PDF
|--------------------------------------------------------------------------
*/

async function signNoticePdf(
  pdfBuffer,
  placement = null
) {
  const pfxPath =
    path.join(
      __dirname,
      "DS Dhule Municipal Corporation.pfx"
    );

  const pfxPassword =
    "Pro452";

  /*
  |--------------------------------------------------------------------------
  | Check PFX
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
  | Signer Name
  |--------------------------------------------------------------------------
  */

  const signerName =
    extractSignerNameFromPfx(
      pfxPath,
      pfxPassword
    );

  /*
  |--------------------------------------------------------------------------
  | Load PDF
  |--------------------------------------------------------------------------
  */

  const pdfDoc =
    await PDFDocument.load(
      pdfBuffer
    );

  const pageCount =
    pdfDoc.getPageCount();

  console.log(
    "[SIGNATURE] Detected PDF page count:",
    pageCount
  );

  if (!pageCount) {
    throw new Error(
      "Generated PDF has no pages"
    );
  }

  let pageNumber =
    pageCount;

  let widgetRect =
    null;

  /*
  |--------------------------------------------------------------------------
  | Signature Placement
  |--------------------------------------------------------------------------
  */

  if (
    placement &&
    placement.widgetRect &&
    placement.pageNumber
  ) {
    pageNumber =
      placement.pageNumber;

    let [
      x1,
      y1,
      x2,
      y2,
    ] =
      placement.widgetRect;

    const boxWidth =
      240;

    const boxHeight =
      100;

    const centerY =
      (y1 + y2) / 2;

    /*
    |--------------------------------------------------------------------------
    | Right Side Position
    |--------------------------------------------------------------------------
    */

    x1 =
      540 -
      boxWidth;

    y1 =
      Math.max(
        0,
        Math.round(
          centerY -
            boxHeight / 2
        )
      );

    /*
    |--------------------------------------------------------------------------
    | Keep Inside A4
    |--------------------------------------------------------------------------
    */

    y1 =
      Math.min(
        y1,
        842 -
          boxHeight
      );

    widgetRect = [
      Math.round(x1),
      Math.round(y1),
      Math.round(
        x1 + boxWidth
      ),
      Math.round(
        y1 + boxHeight
      ),
    ];
  }

  /*
  |--------------------------------------------------------------------------
  | Fallback
  |--------------------------------------------------------------------------
  */

  if (!widgetRect) {
    console.warn(
      "Notice signature placement detection failed — using fallback position"
    );

    const boxWidth =
      240;

    const boxHeight =
      100;

    const marginFromBottom =
      160;

    const x1 =
      540 -
      boxWidth;

    const y1 =
      marginFromBottom;

    widgetRect = [
      Math.round(x1),
      Math.round(y1),
      Math.round(
        x1 + boxWidth
      ),
      Math.round(
        y1 + boxHeight
      ),
    ];

    pageNumber =
      pageCount;
  }

  console.log(
    "Notice signature placement:",
    {
      pageNumber,
      widgetRect,
      signerName,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Sign
  |--------------------------------------------------------------------------
  */

  const signedPdf =
    await signPdf(
      pdfBuffer,
      pfxPath,
      pfxPassword,
      pageNumber,
      widgetRect,
      signerName
    );

  /*
  |--------------------------------------------------------------------------
  | Ensure Signed PDF Is Buffer
  |--------------------------------------------------------------------------
  */

  if (
    Buffer.isBuffer(
      signedPdf
    )
  ) {
    return signedPdf;
  }

  if (
    signedPdf instanceof
    Uint8Array
  ) {
    return Buffer.from(
      signedPdf.buffer,
      signedPdf.byteOffset,
      signedPdf.byteLength
    );
  }

  return Buffer.from(
    signedPdf
  );
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  renderNoticeHtmlService,
  getNoticeByIdService,
  generateNoticeService,
};