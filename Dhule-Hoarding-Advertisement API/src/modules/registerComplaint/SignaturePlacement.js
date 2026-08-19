const SIG_SIZE = 90;
const A4_HEIGHT_PT = 842;
const A4_WIDTH_PT = 595;

const RASTER_SCALE = 2;

const OFFSET_LEFT_PT = 60;
const OFFSET_UP_PT = 20;

const isMarker = (r, g, b) =>
  r > 200 &&
  g < 60 &&
  b > 200;

async function locateSignatureWidget(page) {
  /*
   * ============================================================
   * 1. Put temporary marker over signature anchor
   * ============================================================
   */

  const hasAnchor = await page.evaluate(() => {
    const anchor = document.getElementById("signature-anchor");

    if (!anchor) {
      return false;
    }

    anchor.dataset.previousBackground =
      anchor.style.background || "";

    anchor.style.background = "rgb(255, 0, 255)";

    return true;
  });

  if (!hasAnchor) {
    console.warn(
      "[SIGNATURE] #signature-anchor not found"
    );

    return null;
  }

  let markedPdf;

  try {
    /*
     * Render exactly as the final PDF.
     */
    markedPdf = await page.pdf({
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
  } finally {
    /*
     * ALWAYS remove marker.
     */
    await page.evaluate(() => {
      const anchor =
        document.getElementById("signature-anchor");

      if (!anchor) {
        return;
      }

      anchor.style.background =
        anchor.dataset.previousBackground || "";

      delete anchor.dataset.previousBackground;
    });
  }

  /*
   * ============================================================
   * 2. Load PDF using MuPDF
   * ============================================================
   */

  let mupdf;

  try {
    mupdf = await import("mupdf");
  } catch (error) {
    console.error(
      "[SIGNATURE] mupdf unavailable:",
      error
    );

    return null;
  }

  const doc = mupdf.Document.openDocument(
    markedPdf,
    "application/pdf"
  );

  const pageCount = doc.countPages();

  console.log(
    `[SIGNATURE] Detected PDF page count: ${pageCount}`
  );

  const matrix = mupdf.Matrix.scale(
    RASTER_SCALE,
    RASTER_SCALE
  );

  /*
   * ============================================================
   * 3. Search every PDF page
   * ============================================================
   */

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {

    const pdfPage = doc.loadPage(pageIndex);

    const pix = pdfPage.toPixmap(
      matrix,
      mupdf.ColorSpace.DeviceRGB,
      false,
      false
    );

    const width = pix.getWidth();
    const height = pix.getHeight();

    const pixels = pix.getPixels();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;

    let markerPixels = 0;

    /*
     * Find magenta marker.
     */
    for (let y = 0; y < height; y++) {

      for (let x = 0; x < width; x++) {

        const offset =
          (y * width + x) * 3;

        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];

        if (isMarker(r, g, b)) {

          markerPixels++;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;

          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    /*
     * Marker not found on this page.
     */
    if (markerPixels <= 50) {
      continue;
    }

    console.log(
      `[SIGNATURE] Marker found on PDF page ${pageIndex + 1}`
    );

    /*
     * ========================================================
     * 4. Convert pixels -> PDF points
     * ========================================================
     */

    const markerCenterX =
      ((minX + maxX) / 2) /
      RASTER_SCALE;

    const markerCenterYTop =
      ((minY + maxY) / 2) /
      RASTER_SCALE;

    /*
     * PDF coordinate system:
     *
     * top-left  = raster coordinate
     * bottom-left = PDF coordinate
     *
     * Therefore flip Y.
     */
    const pageHeightPt =
      height / RASTER_SCALE;

    const markerCenterYBottom =
      pageHeightPt -
      markerCenterYTop;

    /*
     * Apply your requested offsets.
     */
    let centerX =
      markerCenterX -
      OFFSET_LEFT_PT;

    let centerY =
      markerCenterYBottom +
      OFFSET_UP_PT;

    /*
     * ========================================================
     * 5. Create 90x90 signature rectangle
     * ========================================================
     */

    let x1 =
      centerX -
      SIG_SIZE / 2;

    let y1 =
      centerY -
      SIG_SIZE / 2;

    let x2 =
      x1 +
      SIG_SIZE;

    let y2 =
      y1 +
      SIG_SIZE;

    /*
     * ========================================================
     * 6. HARD CLAMP
     *
     * This is important.
     *
     * Never allow the signature widget to extend outside
     * the actual PDF page.
     * ========================================================
     */

    x1 = Math.max(0, x1);
    y1 = Math.max(0, y1);

    x2 = Math.min(
      A4_WIDTH_PT,
      x2
    );

    y2 = Math.min(
      A4_HEIGHT_PT,
      y2
    );

    /*
     * If clamping made the rectangle too small,
     * rebuild it safely.
     */

    if ((x2 - x1) < SIG_SIZE) {

      x1 = Math.max(
        0,
        Math.min(
          x1,
          A4_WIDTH_PT - SIG_SIZE
        )
      );

      x2 = x1 + SIG_SIZE;
    }

    if ((y2 - y1) < SIG_SIZE) {

      y1 = Math.max(
        0,
        Math.min(
          y1,
          A4_HEIGHT_PT - SIG_SIZE
        )
      );

      y2 = y1 + SIG_SIZE;
    }

    const widgetRect = [
      Math.round(x1),
      Math.round(y1),
      Math.round(x2),
      Math.round(y2),
    ];

    console.log(
      "[SIGNATURE] Final signature position:",
      {
        pageNumber: pageIndex + 1,
        widgetRect,
        pageCount,
      }
    );

    /*
     * ========================================================
     * 7. RETURN 1-BASED PAGE NUMBER
     * ========================================================
     */

    return {
      pageNumber: pageIndex + 1,
      widgetRect,
    };
  }

  console.warn(
    "[SIGNATURE] Magenta marker was not detected."
  );

  return null;
}

module.exports = {
  locateSignatureWidget,
  A4_HEIGHT_PT,
};