
const { repoGetNoticeById, repoGenerateNotice, repoGetCorporationInfo } = require('./notice.repo');
const {
  signPdfWithPfx,
} = require("../../services/pdfSignerService");

const {
  generatePdfFromHtml,
} = require("../../services/pdfGeneratorService");

const fs = require("fs").promises;
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const {
  signPdf,
  extractSignerNameFromPfx,
} = require("../registerComplaint/signatureHelpers");

const {
  locateSignatureWidget,
} = require("../registerComplaint/SignaturePlacement");

const TEMPLATE_PATH = path.join(__dirname, 'notice.template.html');

async function getSidebarLogoBase64() {
  const logoPath = path.join(
    __dirname,
    "dhule-logo.png"
  );

  try {
    const buf = await fs.readFile(logoPath);

    if (!buf || buf.length === 0) {
      return "";
    }

    console.log("Dhule logo loaded:", logoPath);

    return `data:image/png;base64,${buf.toString("base64")}`;

  } catch (error) {
    console.error(
      "Failed to load Dhule logo:",
      error.message
    );

    return "";
  }
}

async function renderNoticeHtmlService(data = {}) {
  let templateContent = await fs.readFile(
    TEMPLATE_PATH,
    "utf-8"
  );

  // ---------------------------------------------------------
  // Corporation
  // ---------------------------------------------------------

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
      corpInfo = await repoGetCorporationInfo(corpId);
    } catch (err) {
      console.error(
        "Error fetching corporation info:",
        err.message
      );
    }
  }

  const sidebarLogoBase64 =
    await getSidebarLogoBase64();

  const logoValue = sidebarLogoBase64;

  const corpNameValue =
    data.corporationName ||
    data.corporation_name ||
    corpInfo?.corporationName ||
    "धुळे महानगरपालिका";

  // ---------------------------------------------------------
  // Size
  // ---------------------------------------------------------

  const sizeValue = data.SIZE 

  // ---------------------------------------------------------
  // Date formatter
  // ---------------------------------------------------------

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return String(dateValue);
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // ---------------------------------------------------------
  // Notice date
  // ---------------------------------------------------------

  const noticeDate =
    data.NOTICE_DATE ||
    formatDate(
      data.SYSTEM_DATE || data.system_date
    );

  // ---------------------------------------------------------
  // Replacements
  // ---------------------------------------------------------

  const replacements = {
    corporationLogo: logoValue,

    corporationName: corpNameValue,

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

    SIZE: sizeValue,

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
      data.AMOUNT_DATA   , 

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
      ""
  };

  // ---------------------------------------------------------
  // Replace template variables
  // ---------------------------------------------------------

  Object.entries(replacements).forEach(
    ([key, val]) => {
      const regex = new RegExp(
        `\\{\\{\\s*${key}\\s*\\}\\}`,
        "g"
      );

      templateContent = templateContent.replace(
        regex,
        val !== null && val !== undefined
          ? String(val)
          : ""
      );
    }
  );

  return templateContent;
}

async function getNoticeByIdService(id) {
  const dbData = await repoGetNoticeById(id);
  const data = dbData || {};
  const html = await renderNoticeHtmlService(data);
  return { data, html };
}

async function generateNoticeService(payload) {
  // =========================================================
  // BASIC VALIDATION
  // =========================================================

  if (!payload) {
    throw new Error("Request payload is required");
  }

  const userId = payload.userId;

  const ulbId =
    payload.ULB_ID ||
    payload.ulbId ||
    payload.corporationId;

  const panchanamaNo =
    payload.PANCHANAMA_NO ||
    payload.panchanamaNo ||
    payload.VAR_ILLEGALHOARD_PANCHANAMA_NO;

  if (!panchanamaNo) {
    throw new Error("Panchanama number is required");
  }

  if (!ulbId) {
    throw new Error("ULB ID is required");
  }

  // =========================================================
  // CALL ORACLE PROCEDURE
  // =========================================================

  const procResult = await repoGenerateNotice({
    userId,
    ulbId,
    PANCHANAMA_NO: panchanamaNo,
  });

  // =========================================================
  // CHECK PROCEDURE ERROR
  // =========================================================

  const errorCode = procResult.errorCode;

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

  // =========================================================
  // PROCEDURE DATA
  // =========================================================

  const noticeData = procResult.noticeData || {};

  // =========================================================
  // MERGE WITH FRONTEND PAYLOAD
  // =========================================================

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
  };

  // =========================================================
  // GENERATE HTML
  // =========================================================

  const html =
    await renderNoticeHtmlService(
      mergedData
    );

  // =========================================================
  // GENERATE PDF
  // =========================================================

  const { pdfBuffer, placement } = await generatePdfFromHtml(html);

  console.log("Generated PDF:", {
  isBuffer: Buffer.isBuffer(pdfBuffer),
  length: pdfBuffer.length,
});

if (!Buffer.isBuffer(pdfBuffer)) {
  throw new Error("PDF generation failed: result is not a Buffer");
}

const signedPdfBuffer = await signNoticePdf(pdfBuffer, placement);

  console.log("Signed PDF:", {
    isBuffer: Buffer.isBuffer(signedPdfBuffer),
    length: signedPdfBuffer.length,
  });

  if (!Buffer.isBuffer(signedPdfBuffer)) {
    throw new Error(
      "PDF signing failed: result is not a Buffer"
    );
  }

  // =========================================================
  // RETURN ONLY SIGNED PDF
  // =========================================================

  return signedPdfBuffer;
}

// signNoticePdf no longer needs `page` — it needs `placement` directly
async function signNoticePdf(pdfBuffer, placement = null) {
  const pfxPath = path.join(__dirname, "DS Dhule Municipal Corporation.pfx");
  const pfxPassword = "Pro452";
  const signerName = extractSignerNameFromPfx(pfxPath, pfxPassword);

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();

  if (!pageCount) {
    throw new Error("Generated PDF has no pages");
  }

  let pageNumber = pageCount;
  let widgetRect = null;

  if (placement && placement.widgetRect && placement.pageNumber) {
    pageNumber = placement.pageNumber;
    widgetRect = placement.widgetRect;
  }

  if (!widgetRect) {
    console.warn("Notice signature placement detection failed — using fallback position");
    const boxSize = 70;
    const marginFromBottom = 160;
    const x1 = (595 - boxSize) / 2;
    const y1 = marginFromBottom;

    widgetRect = [
      Math.round(x1),
      Math.round(y1),
      Math.round(x1 + boxSize),
      Math.round(y1 + boxSize),
    ];
    pageNumber = pageCount;
  }

  console.log("Notice signature placement:", { pageNumber, widgetRect, signerName });

  return await signPdf(pdfBuffer, pfxPath, pfxPassword, pageNumber, widgetRect, signerName);
}

module.exports = {
  renderNoticeHtmlService,
  getNoticeByIdService,
  generateNoticeService,
};
