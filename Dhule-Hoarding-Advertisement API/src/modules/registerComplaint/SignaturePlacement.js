// Robustly locates the visible digital-signature widget's rectangle on the
// rendered PDF.
//
// Why this exists:
// Puppeteer's `page.pdf()` paginates content in *print* layout, which does not
// match the *screen* layout that `getBoundingClientRect()` reports. Mapping a
// screen-space Y coordinate onto a print page with a fixed "printable height per
// page" formula is unreliable, because real page breaks happen early whenever an
// unbreakable block (table row, list item, heading) would overflow — so content
// above the seal shifts the seal's true page position in ways the formula cannot
// predict (the position is even non-monotonic in content length).
//
// Instead, we let Chrome paginate, render the page to PDF with a temporary,
// uniquely-coloured marker painted over the signature anchor, rasterize the
// rendered PDF, and read the marker's *actual* page and coordinates. The marker
// is removed before the real (clean) PDF is produced, so it never appears in the
// output.

const SIG_SIZE = 90;                 // signature widget box size in PDF points
const A4_HEIGHT_PT = 842;            // A4 height in points (must match page.pdf format)
const RASTER_SCALE = 2;              // pixels per point when rasterizing for detection
// Fine-tuning nudges (in PDF points) applied to the widget relative to the
// detected anchor centre, so the "?" sits up-and-left over the seal heading
// rather than dead-centre on the "Digitally signed by" line. Tweak to taste.
const OFFSET_LEFT_PT = 60;           // move the widget left of the anchor centre
const OFFSET_UP_PT = 20;             // move the widget up (toward the seal heading)
// Magenta: fully saturated, and verified absent from the corporation logos and
// document content, so it is unambiguous to detect.
const isMarker = (r, g, b) => r > 200 && g < 60 && b > 200;

/**
 * Render a marker over `#signature-anchor`, find where it actually lands in the
 * paginated PDF, and return the widget rectangle centred on it.
 *
 * @param {import('puppeteer').Page} page - a page whose content is already set.
 * @returns {Promise<{pageNumber:number, widgetRect:number[]}|null>}
 *          null if the anchor is missing, mupdf is unavailable, or the marker
 *          could not be located — callers should fall back gracefully.
 */
async function locateSignatureWidget(page) {
  // 1) Paint a detectable marker on the anchor (it is absolutely positioned and
  //    out of flow, so this does not change pagination), render, then remove it.
  //    The marker is ALWAYS cleared (finally), so it can never leak into the
  //    clean output PDF the caller renders next, even if rendering throws.
  const clearMarker = () =>
    page.evaluate(() => {
      const a = document.getElementById("signature-anchor");
      if (a) {
        a.style.background = a.dataset.prevBg || "";
        delete a.dataset.prevBg;
      }
    });

  const hasAnchor = await page.evaluate(() => {
    const a = document.getElementById("signature-anchor");
    if (!a) return false;
    a.dataset.prevBg = a.style.background || "";
    a.style.background = "rgb(255,0,255)";
    return true;
  });
  if (!hasAnchor) return null;

  let markedPdf;
  try {
    markedPdf = await page.pdf({ format: "A4", printBackground: true });
  } finally {
    await clearMarker();
  }

  // 2) Rasterize and locate the marker. The seal is the last content block, so
  //    scan from the last page backwards — the marker is almost always on the
  //    final page and we stop as soon as we find it.
  let mupdf;
  try {
    mupdf = await import("mupdf");
  } catch (e) {
    return null; // rasterizer unavailable -> let caller fall back
  }

  const doc = mupdf.Document.openDocument(markedPdf, "application/pdf");
  const pageCount = doc.countPages();
  const matrix = mupdf.Matrix.scale(RASTER_SCALE, RASTER_SCALE);

  for (let i = pageCount - 1; i >= 0; i--) {
    const pix = doc
      .loadPage(i)
      .toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, false);
    const w = pix.getWidth();
    const h = pix.getHeight();
    const px = pix.getPixels(); // RGB, 3 bytes per pixel (no alpha)

    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1, count = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 3;
        if (isMarker(px[o], px[o + 1], px[o + 2])) {
          count++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (count > 50) {
      // Pixel bbox -> PDF points. Image origin is top-left; PDF origin is
      // bottom-left, so flip Y.
      const centerXPt = (minX + maxX) / 2 / RASTER_SCALE - OFFSET_LEFT_PT;
      const centerYTopPt = (minY + maxY) / 2 / RASTER_SCALE;
      const centerYBottomPt = h / RASTER_SCALE - centerYTopPt + OFFSET_UP_PT;

      const x1 = Math.round(centerXPt - SIG_SIZE / 2);
      const y1 = Math.round(centerYBottomPt - SIG_SIZE / 2);
      return {
        pageNumber: i + 1,
        widgetRect: [x1, y1, x1 + SIG_SIZE, y1 + SIG_SIZE],
      };
    }
  }

  return null;
}

module.exports = { locateSignatureWidget, A4_HEIGHT_PT };