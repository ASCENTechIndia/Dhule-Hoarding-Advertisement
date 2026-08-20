const path = require("path");
const { SignPdf } = require("@signpdf/signpdf");
const { P12Signer } = require("@signpdf/signer-p12");
const { PDFDocument } = require("pdf-lib");
const puppeteer = require("puppeteer");
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
  createVisibleSignature,
  signPdf,
  extractSignerNameFromPfx,
} = require("./signatureHelpers");
const { locateSignatureWidget } = require("./SignaturePlacement");

const fs = require("fs").promises;
const TEMPLATE_PATH = path.join(__dirname, "panchanama.template.html");

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
  limit,
) {
  return compListRepo(si_id, ulbid, fromDate, toDate, status, page, limit);
}

async function serviceSupervisorList(ulbid) {
  return repoSupervisorList(ulbid);
}

async function regParticipantService(payload) {
  return regParticipantRepo(payload);
}

async function getPanchanamalistService(fromDate, toDate, page, limit) {
  return getPanchanamalistRepo(fromDate, toDate, page, limit);
}

async function illegalHoardService(payload) {
  return illegalHoardRepo(payload);
}

async function getPanchanamaDetailsService(id) {
  return getPanchanamaDetailsRepo(id);
}

function formatPanchanamaDateTime(dateStr, timeStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let formattedTime = "";
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    formattedTime = `${h12}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }
  return formattedTime
    ? `${day}/${month}/${year} - ${formattedTime}`
    : `${day}/${month}/${year}`;
}
function buildDetailsRows(details) {
  if (!details || details.length === 0) {
    return `<tr><td colspan="3" class="no-data">कोणतेही कर्मचारी नाहीत.</td></tr>`;
  }
  return details
    .map(
      (item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.VAR_USER || "-"}</td>
      <td>${item.VAR_USER_POST || "-"}</td>
    </tr>
  `,
    )
    .join("");
}
function buildDemolitionRows(demolitionDetails) {
  if (!demolitionDetails || demolitionDetails.length === 0) {
    return `<tr><td colspan="2" class="no-data">कोणतीही माहिती नाही.</td></tr>`;
  }
  return demolitionDetails
    .map(
      (item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.VAR_DEMONSTARTED_NAME || "-"}</td>
    </tr>
  `,
    )
    .join("");
}
function buildPhotoGrid(master) {
  const photos = [
    master.BLOB_NEAR_PHOTO,
    master.BLOB_FAR_PHOTO,
    master.BLOB_USER_PHOTO,
  ].filter((img) => img && typeof img === "string" && img.trim() !== "");

  if (photos.length === 0) {
    return `<div class="no-data">फोटो उपलब्ध नाहीत.</div>`;
  }
  const labels = ["जवळून फोटो", "दुरून फोटो", "पंचनामा करणाऱ्यासोबत फोटो"];
  return photos
    .map(
      (base64, idx) => `
    <div class="photo-item">
      <img src="data:image/jpeg;base64,${base64}" alt="${labels[idx] || "फोटो"}" />
      <span class="photo-label">${labels[idx] || "फोटो"}</span>
    </div>
  `,
    )
    .join("");
}
async function renderPanchanamaHtml(data = {}) {
  const master = data.master || {};
  const details = data.details || [];
  const demolitionDetails = data.demolitionDetails || [];

  // template path
  let templateContent = await fs.readFile(TEMPLATE_PATH, "utf-8");

  // Build dynamic parts
  const captureDateTime = formatPanchanamaDateTime(
    master.DAT_CAP_DT,
    master.VAR_CAP_TIME,
  );
  const detailsRows = buildDetailsRows(details);
  const demolitionRows = buildDemolitionRows(demolitionDetails);
  const photoGrid = buildPhotoGrid(master);

  const logoBuffer = await fs.readFile(
    path.join(__dirname, "../../img/dhule-logo.png"),
  );
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  // Prepare replacement map
  const currentDate = new Date()
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");

  const replacements = {
    // Master fields
    VAR_ILLEGALHOARD_PANCHANAMA_NO:
      master.VAR_ILLEGALHOARD_PANCHANAMA_NO || "-",

    CAPTURE_DATE_TIME: captureDateTime,

    VAR_USER1: master.VAR_USER1 || "-",

    VAR_USER1_POST: master.VAR_USER1_POST || "-",

    VAR_ILLEGALHOARD_ADD: master.VAR_ILLEGALHOARD_ADD || "-",

    VAR_ILLEGALHOARD_WARD: master.VAR_ILLEGALHOARD_WARD || "-",

    NUM_SIZE_LENGTH: master.NUM_SIZE_LENGTH || "-",

    NUM_SIZE_WIDTH: master.NUM_SIZE_WIDTH || "-",

    DAT_FROM_DT: master.DAT_FROM_DT
      ? new Date(master.DAT_FROM_DT).toLocaleDateString("en-IN")
      : "-",

    // Table rows
    DETAILS_ROWS: detailsRows,

    DEMOLITION_ROWS: demolitionRows,

    PHOTO_GRID: photoGrid,

    // Footer
    OFFICER_NAME: master.VAR_USER1 || "-",

    OFFICER_POST: master.VAR_USER1_POST || "-",

    REGIONAL_OFFICE: master.VAR_ILLEGALHOARD_WARD || "-",

    CORPORATION_LOGO: logoBase64 || "",

    // Today's date
    CURRENT_DATE: currentDate,
  };

  // Replace all placeholders
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    templateContent = templateContent.replace(regex, String(value));
  });

  return templateContent;
}
// async function generatePanchnamaPdfService(id) {
//   const result = await getPanchanamaDetailsRepo(id);
//   const html = await renderPanchanamaHtml(result);

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });
//   const page = await browser.newPage();
//   await page.setContent(html, { waitUntil: "networkidle0" });
//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//     margin: { top: "10mm", bottom: "10mm", left: "12mm", right: "12mm" },
//   });
//   await browser.close();
//   return pdfBuffer;
// }

async function generatePanchnamaPdfService(id) {
  // 1. Fetch data
  const result = await getPanchanamaDetailsRepo(id);
  if (!result || !result.master) throw new Error("Panchanama data not found");

  // 2. Generate HTML
  const html = await renderPanchanamaHtml(result);

  // 3. Launch Puppeteer and set content
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  // 4. Detect signature anchor (if possible)
  let placement = null;
  try {
    placement = await locateSignatureWidget(page);
  } catch (e) {
    console.warn("Signature placement detection failed:", e.message);
  }

  // 5. Generate the final (clean) PDF without marker
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "12mm", right: "12mm" },
  });
  await browser.close();

  // 6. Determine last page (fallback if detection gives invalid page)
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();
  const lastPage = pageCount;

  // 7. Decide widget rectangle and page number
  let pageNumber;
  let widgetRect;

  if (placement && placement.widgetRect && placement.pageNumber) {
    let [x1, y1, x2, y2] = placement.widgetRect;
    const boxSize = 70;
    const width = x2 - x1;
    const height = y2 - y1;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    x1 = Math.max(0, Math.round(centerX - width / 2));
    y1 = Math.max(0, Math.round(centerY - height / 2));
    x2 = x1 + boxSize;
    y2 = y1 + boxSize;
    x1 = Math.min(x1, 595 - boxSize);
    y1 = Math.min(y1, 842 - boxSize);
    x2 = x1 + boxSize;
    y2 = y1 + boxSize;
    widgetRect = [x1, y1, x2, y2];
    pageNumber = placement.pageNumber;
  } else {
    // Fallback: place at bottom‑center, above the footer text
    const boxSize = 70;
    const marginFromBottom = 160; // adjust to position above the text
    const centerX = (595 - boxSize) / 2;
    const y1 = marginFromBottom;
    const y2 = y1 + boxSize;
    const x1 = centerX;
    const x2 = x1 + boxSize;
    widgetRect = [
      Math.round(x1),
      Math.round(y1),
      Math.round(x2),
      Math.round(y2),
    ];
    pageNumber = lastPage;
  }

  // 8. Get PFX credentials and signer name (for display, but not used in appearance)
  const pfxPath = path.join(__dirname, "DS Dhule Municipal Corporation.pfx");
  const pfxPassword = "Pro452";
  const signerName = extractSignerNameFromPfx(pfxPath, pfxPassword);

  // 9. Add visible placeholder and sign
  const signedPdf = await signPdf(
    pdfBuffer,
    pfxPath,
    pfxPassword,
    pageNumber,
    widgetRect,
    signerName,
  );

  return signedPdf;
}

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
