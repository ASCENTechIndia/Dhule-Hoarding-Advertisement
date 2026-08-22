const fs = require("fs");

const {
  PDFDocument,
  PDFName,
  PDFString,
  PDFHexString,
} = require("pdf-lib");

const { SignPdf } = require("@signpdf/signpdf");
const { P12Signer } = require("@signpdf/signer-p12");
const forge = require("node-forge");
  const path = require("path");


// ============================================================
// CONFIGURATION
// ============================================================

const SIG_SIZE = 90;

const A4_WIDTH_PT = 595.28;

const RASTER_SCALE = 2;


// ============================================================
// 1. EXTRACT SIGNER NAME FROM PFX
// ============================================================

function extractSignerNameFromPfx(pfxPath, password) {

  try {

    const p12Buffer =
      fs.readFileSync(pfxPath);

    const p12Der =
      forge.util.createBuffer(
        p12Buffer.toString("binary")
      );

    const p12Asn1 =
      forge.asn1.fromDer(p12Der);

    const p12 =
      forge.pkcs12.pkcs12FromAsn1(
        p12Asn1,
        password
      );

    for (const safeContent of p12.safeContents) {

      for (const safeBag of safeContent.safeBags) {

        if (safeBag.cert) {

          const attrs =
            safeBag.cert.subject.attributes;

          const cn =
            attrs.find(
              attr =>
                attr.shortName === "CN"
            );

          return cn
            ? cn.value
            : attrs
                .map(a => a.value)
                .join(", ");
        }
      }
    }

    return "";

  } catch (error) {

    console.error(
      "PFX Read Error:",
      error
    );

    return "";
  }
}


// ============================================================
// 2. FIND #signature-anchor IN PRINTED PDF
// ============================================================
//
// This is the important new function.
//
// It:
//
// 1. Finds #signature-anchor in HTML
// 2. Temporarily paints it MAGENTA
// 3. Generates temporary PDF
// 4. Finds the actual printed page
// 5. Finds exact X/Y position
// 6. Converts browser coordinates to PDF coordinates
// 7. Removes marker
//
// Result:
//
// {
//    pageNumber: 1,
//    widgetRect: [x1, y1, x2, y2]
// }
//

async function locateSignatureAnchor(page) {

  console.log(
    "🔍 Looking for #signature-anchor..."
  );

  // ----------------------------------------------------------
  // Check anchor
  // ----------------------------------------------------------

  const anchorExists =
    await page.evaluate(() => {

      const anchor =
        document.getElementById(
          "signature-anchor"
        );

      if (!anchor) {
        return false;
      }

      // Save original background
      anchor.dataset.previousBackground =
        anchor.style.background || "";

      // Temporary marker
      anchor.style.background =
        "rgb(255, 0, 255)";

      return true;
    });


  if (!anchorExists) {

    throw new Error(
      "❌ #signature-anchor was not found in HTML template"
    );
  }


  let markedPdf;


  try {

    // --------------------------------------------------------
    // Generate temporary PDF
    // --------------------------------------------------------

    markedPdf =
      await page.pdf({

        format: "A4",

        printBackground: true
      });

  } finally {

    // --------------------------------------------------------
    // ALWAYS remove marker
    // --------------------------------------------------------

    await page.evaluate(() => {

      const anchor =
        document.getElementById(
          "signature-anchor"
        );

      if (anchor) {

        anchor.style.background =
          anchor.dataset.previousBackground || "";

        delete anchor.dataset.previousBackground;
      }

    });

  }


  // ----------------------------------------------------------
  // Load mupdf
  // ----------------------------------------------------------

  let mupdf;

  try {

    mupdf =
      await import("mupdf");

  } catch (error) {

    throw new Error(
      "mupdf is required for automatic signature placement. " +
      "Install it using: npm install mupdf"
    );
  }


  // ----------------------------------------------------------
  // Open temporary PDF
  // ----------------------------------------------------------

  const doc =
    mupdf.Document.openDocument(
      markedPdf,
      "application/pdf"
    );

  const pageCount =
    doc.countPages();


  const matrix =
    mupdf.Matrix.scale(
      RASTER_SCALE,
      RASTER_SCALE
    );


  // ----------------------------------------------------------
  // Search pages from last → first
  // ----------------------------------------------------------

  for (
    let pageIndex = pageCount - 1;
    pageIndex >= 0;
    pageIndex--
  ) {

    const pdfPage =
      doc.loadPage(pageIndex);


    const pix =
      pdfPage.toPixmap(
        matrix,
        mupdf.ColorSpace.DeviceRGB,
        false,
        false
      );


    const width =
      pix.getWidth();

    const height =
      pix.getHeight();

    const pixels =
      pix.getPixels();


    let minX = Infinity;
    let minY = Infinity;

    let maxX = -1;
    let maxY = -1;

    let pixelCount = 0;


    // --------------------------------------------------------
    // Find MAGENTA marker
    // --------------------------------------------------------

    for (
      let y = 0;
      y < height;
      y++
    ) {

      for (
        let x = 0;
        x < width;
        x++
      ) {

        const offset =
          (y * width + x) * 3;


        const r =
          pixels[offset];

        const g =
          pixels[offset + 1];

        const b =
          pixels[offset + 2];


        // MAGENTA
        if (
          r > 200 &&
          g < 60 &&
          b > 200
        ) {

          pixelCount++;


          minX =
            Math.min(
              minX,
              x
            );

          maxX =
            Math.max(
              maxX,
              x
            );

          minY =
            Math.min(
              minY,
              y
            );

          maxY =
            Math.max(
              maxY,
              y
            );
        }
      }
    }


    // --------------------------------------------------------
    // Marker found
    // --------------------------------------------------------

    if (pixelCount > 50) {

      console.log(
        "✅ Signature anchor detected"
      );


      console.log(
        "PDF page:",
        pageIndex + 1
      );


      // ------------------------------------------------------
      // Convert pixels → PDF points
      // ------------------------------------------------------

      const x =
        minX / RASTER_SCALE;

      const yTop =
        minY / RASTER_SCALE;

      const anchorWidth =
        (maxX - minX) /
        RASTER_SCALE;

      const anchorHeight =
        (maxY - minY) /
        RASTER_SCALE;


      // ------------------------------------------------------
      // PDF coordinate system starts from BOTTOM
      // ------------------------------------------------------

      const y =
        A4_HEIGHT_PT -
        yTop -
        anchorHeight;


      // ------------------------------------------------------
      // Use actual anchor size
      //
      // But keep signature box square.
      // ------------------------------------------------------

      const size =
        Math.min(
          anchorWidth,
          anchorHeight
        );


      // Center signature inside anchor

      const x1 =
        x +
        (anchorWidth - size) / 2;

      const y1 =
        y +
        (anchorHeight - size) / 2;


      const x2 =
        x1 + size;

      const y2 =
        y1 + size;


      const widgetRect = [

        Math.round(x1),

        Math.round(y1),

        Math.round(x2),

        Math.round(y2)

      ];


      console.log(
        "Signature rectangle:",
        widgetRect
      );


      return {

        pageNumber:
          pageIndex + 1,

        widgetRect

      };
    }
  }


  throw new Error(
    "❌ Could not detect #signature-anchor position in generated PDF"
  );
}


// ============================================================
// 3. CREATE VISIBLE SIGNATURE
// ============================================================

async function createVisibleSignature(
  pdfBuffer,
  pageNumber,
  widgetRect
) {

  const pdfDoc =
    await PDFDocument.load(
      pdfBuffer
    );


  const page =
    pdfDoc.getPage(
      pageNumber - 1
    );


  const pageRef =
    page.ref;


  // ----------------------------------------------------------
  // Page annotations
  // ----------------------------------------------------------

  let annots =
    page.node.get(
      PDFName.of("Annots")
    );


  if (!annots) {

    annots =
      pdfDoc.context.obj([]);

    page.node.set(
      PDFName.of("Annots"),
      annots
    );

  } else {

    annots =
      pdfDoc.context.lookup(
        annots
      );
  }


  // ----------------------------------------------------------
  // Fonts
  // ----------------------------------------------------------

  const helvDict =
    pdfDoc.context.obj({

      Type: "Font",

      Subtype: "Type1",

      BaseFont: "Helvetica",

      Encoding: "WinAnsiEncoding",

    });


  const helvRef =
    pdfDoc.context.register(
      helvDict
    );


  const zaDbDict =
    pdfDoc.context.obj({

      Type: "Font",

      Subtype: "Type1",

      BaseFont: "ZapfDingbats",

    });


  const zaDbRef =
    pdfDoc.context.register(
      zaDbDict
    );


  const fontDict =
    pdfDoc.context.obj({

      Helv: helvRef,

      ZaDb: zaDbRef,

    });


  const fontDictRef =
    pdfDoc.context.register(
      fontDict
    );


  // ----------------------------------------------------------
  // AcroForm
  // ----------------------------------------------------------

  let acroForm =
    pdfDoc.catalog.get(
      PDFName.of("AcroForm")
    );


  let acroFormDict;


  if (!acroForm) {

    acroFormDict =
      pdfDoc.context.obj({

        Fields: [],

        SigFlags: 3,

        DR: {
          Font: fontDictRef
        },

        DA:
          PDFString.of(
            "/Helv 0 Tf 0 g"
          ),

      });


    pdfDoc.catalog.set(

      PDFName.of("AcroForm"),

      pdfDoc.context.register(
        acroFormDict
      )

    );

  } else {

    acroFormDict =
      pdfDoc.context.lookup(
        acroForm
      );


    if (
      !acroFormDict.get(
        PDFName.of("SigFlags")
      )
    ) {

      acroFormDict.set(

        PDFName.of("SigFlags"),

        pdfDoc.context.obj(3)

      );
    }


    if (
      !acroFormDict.get(
        PDFName.of("DA")
      )
    ) {

      acroFormDict.set(

        PDFName.of("DA"),

        PDFString.of(
          "/Helv 0 Tf 0 g"
        )

      );
    }
  }


  // ----------------------------------------------------------
  // Fields
  // ----------------------------------------------------------

  let fields =
    acroFormDict.get(
      PDFName.of("Fields")
    );


  if (!fields) {

    fields =
      pdfDoc.context.obj([]);

    acroFormDict.set(

      PDFName.of("Fields"),

      fields

    );

  } else {

    fields =
      pdfDoc.context.lookup(
        fields
      );
  }


  // ----------------------------------------------------------
  // Signature rectangle
  // ----------------------------------------------------------

  const [
    x1,
    y1,
    x2,
    y2
  ] = widgetRect;


  const width =
    x2 - x1;


  const height =
    y2 - y1;


  // ----------------------------------------------------------
  // Appearance
  // ----------------------------------------------------------

  const gsDict =
    pdfDoc.context.obj({

      Type: "ExtGState",

      ca: 0.4,

      CA: 0.4,

      BM: "Normal",

    });


  const gsRef =
    pdfDoc.context.register(
      gsDict
    );


  const createLayer = (
    bbox,
    stream
  ) => {

    const dict =
      pdfDoc.context.obj({

        Type: "XObject",

        Subtype: "Form",

        BBox: bbox,

        Resources: {

          Font:
            fontDictRef,

        },

      });


    const xobject =
      pdfDoc.context.stream(
        stream,
        dict
      );


    return pdfDoc.context.register(
      xobject
    );
  };


  const n0Ref =
    createLayer(
      [0, 0, width, height],
      ""
    );


  const n1Ref =
    createLayer(
      [0, 0, width, height],
      ""
    );


  const n2Ref =
    createLayer(
      [0, 0, 0, 0],
      "q Q"
    );


  // ----------------------------------------------------------
  // Question mark appearance
  // ----------------------------------------------------------

  const size =
    Math.min(
      width,
      height
    );


  const scale =
    size / 100;


  const dx =
    (width - size) / 2;


  const dy =
    (height - size) / 2;


//   const n3Path = `

// q

// ${scale.toFixed(4)}
// 0
// 0
// ${scale.toFixed(4)}
// ${(dx + 4).toFixed(2)}
// ${(dy + 4).toFixed(2)}
// cm

// 0.65 0.55 0.20 rg

// 42 22 12 12 re f

// 44 31 m
// 44 41 l
// 44 41 48 51 56 61 c
// 56 61 56 71 48 71 c
// 48 71 38 71 34 57 c
// 24 61 l
// 24 61 24 75 48 85 c
// 48 85 72 85 72 63 c
// 72 63 72 41 56 41 c
// 56 31 l
// 44 31 l
// h
// f

// 0.95 0.82 0.20 rg
// 0.60 0.50 0.15 RG
// 1.5 w

// 44 24 12 12 re B

// 46 44 m
// 46 53 l
// 46 53 50 53 58 63 c
// 58 63 58 73 50 73 c
// 50 73 40 73 36 59 c
// 26 63 l
// 26 63 26 77 50 87 c
// 50 87 74 87 74 65 c
// 74 65 74 43 58 43 c
// 58 33 l
// 46 44 l
// h
// B

// Q
// `;


//   const n3Ref =
//     createLayer(
//       [0, 0, width, height],
//       n3Path
//     );



const QUESTION_MARK_PNG_PATH = path.join(
  __dirname,
  "../img/yello-questionmark.png"
);

if (!fs.existsSync(QUESTION_MARK_PNG_PATH)) {
  throw new Error(
    `Question mark PNG not found at: ${QUESTION_MARK_PNG_PATH}`
  );
}

const questionMarkPngBytes =
  fs.readFileSync(QUESTION_MARK_PNG_PATH);

const questionMarkImage =
  await pdfDoc.embedPng(questionMarkPngBytes);

// ----------------------------------------------------------
// Preserve original aspect ratio
// ----------------------------------------------------------

const iconAspect =
  questionMarkImage.width /
  questionMarkImage.height;

let iconW = width;
let iconH = width / iconAspect;

if (iconH > height) {
  iconH = height;
  iconW = height * iconAspect;
}

const ICON_MOVE_X = 5;

// Move UP / DOWN
// Positive = up
// Negative = down
const ICON_MOVE_Y = 5;

const iconX =
  (width - iconW) / 2 +
  ICON_MOVE_X;

const iconY =
  (height - iconH) / 2 +
  ICON_MOVE_Y;

// ----------------------------------------------------------
// DARKER YELLOW EFFECT
// ----------------------------------------------------------

const darkYellowDict =
  pdfDoc.context.obj({
    Type: "ExtGState",

    // Slightly faded
    ca: 0.60,
    CA: 0.60,

    // Keep darker yellow
    BM: "Normal"
  });

const darkYellowRef =
  pdfDoc.context.register(
    darkYellowDict
  );

// ----------------------------------------------------------
// Question mark image layer
// ----------------------------------------------------------

const n3Dict =
  pdfDoc.context.obj({
    Type: "XObject",

    Subtype: "Form",

    BBox: [
      0,
      0,
      width,
      height
    ],

    Resources: {

      XObject: {
        Icon: questionMarkImage.ref
      },

      ExtGState: {
        DarkYellow: darkYellowRef
      }

    }

  });

const n3Stream =
  pdfDoc.context.stream(

    `
q

/DarkYellow gs

${iconW.toFixed(2)}
0
0
${iconH.toFixed(2)}
${iconX.toFixed(2)}
${iconY.toFixed(2)}
cm

/Icon Do

Q
    `,

    n3Dict

  );

const n3Ref =
  pdfDoc.context.register(
    n3Stream
  );


  const n4Ref =
    createLayer(
      [0, 0, width, height],
      ""
    );


  // ----------------------------------------------------------
  // Normal appearance
  // ----------------------------------------------------------

  const normalAppearanceDict =
    pdfDoc.context.obj({

      Type: "XObject",

      Subtype: "Form",

      BBox: [
        0,
        0,
        width,
        height
      ],

      Resources: {

        XObject: {

          n0: n0Ref,

          n1: n1Ref,

          n2: n2Ref,

          n3: n3Ref,

          n4: n4Ref

        },

        ExtGState: {

          GS0: gsRef

        },

        Font:
          fontDictRef

      },

    });


  const normalAppearanceStream =
    pdfDoc.context.stream(

      `
q
1 0 0 1 0 0 cm
/n0 Do
Q

q
/GS0 gs
1 0 0 1 0 0 cm
/n1 Do
Q

q
/GS0 gs
1 0 0 1 0 0 cm
/n3 Do
Q

q
/GS0 gs
1 0 0 1 0 0 cm
/n4 Do
Q
      `,

      normalAppearanceDict
    );


  const normalAppearanceRef =
    pdfDoc.context.register(
      normalAppearanceStream
    );


  // ----------------------------------------------------------
  // Signature dictionary
  // ----------------------------------------------------------

  const signatureDict =
    pdfDoc.context.obj({

      Type: "Sig",

      Filter:
        "Adobe.PPKLite",

      SubFilter:
        "adbe.pkcs7.detached",

      ByteRange: [

        0,

        PDFName.of(
          "**********"
        ),

        PDFName.of(
          "**********"
        ),

        PDFName.of(
          "**********"
        ),

      ],

      Contents:
        PDFHexString.of(
          "A".repeat(15000)
        ),

    });


  const signatureDictRef =
    pdfDoc.context.register(
      signatureDict
    );


  // ----------------------------------------------------------
  // Signature Widget
  // ----------------------------------------------------------

  const widgetDict =
    pdfDoc.context.obj({

      Type: "Annot",

      Subtype: "Widget",

      FT: "Sig",

      T:
        PDFString.of(
          "Signature1"
        ),

      Rect: [

        x1,
        y1,
        x2,
        y2,

      ],

      V:
        signatureDictRef,

      F: 4,

      P:
        pageRef,

      AP: {

        N:
          normalAppearanceRef

      },

      MK: {

        TP: 1,

        BG: [
          1,
          1,
          1
        ],

        BC: [
          1,
          1,
          1
        ],

      },

      DA:
        PDFString.of(
          "/Helv 0 Tf 1 1 1 rg"
        ),

    });


  const widgetRef =
    pdfDoc.context.register(
      widgetDict
    );


  // ----------------------------------------------------------
  // Add widget
  // ----------------------------------------------------------

  annots.push(
    widgetRef
  );


  fields.push(
    widgetRef
  );


  // ----------------------------------------------------------
  // Save
  // ----------------------------------------------------------

  const pdfBytes =
    await pdfDoc.save({

      useObjectStreams:
        false

    });


  return Buffer.from(
    pdfBytes
  );
}


// ============================================================
// 4. SIGN PDF
// ============================================================

async function signPdf({

  pdfBuffer,

  pfxPath,

  password,

  pageNumber,

  widgetRect,

}) {

  if (!Buffer.isBuffer(pdfBuffer)) {

    pdfBuffer =
      Buffer.from(
        pdfBuffer
      );
  }


  if (!pfxPath) {

    throw new Error(
      "PFX path is required"
    );
  }


  if (!fs.existsSync(pfxPath)) {

    throw new Error(
      `PFX file not found: ${pfxPath}`
    );
  }


  if (!password) {

    throw new Error(
      "PFX password is required"
    );
  }


  if (!pageNumber) {

    throw new Error(
      "Signature page number is required"
    );
  }


  if (
    !Array.isArray(widgetRect) ||
    widgetRect.length !== 4
  ) {

    throw new Error(
      "widgetRect must be [x1, y1, x2, y2]"
    );
  }


  // ----------------------------------------------------------
  // STEP 1
  // Add signature field
  // ----------------------------------------------------------

  const pdfWithPlaceholder =
    await createVisibleSignature(

      pdfBuffer,

      pageNumber,

      widgetRect

    );


  // ----------------------------------------------------------
  // STEP 2
  // Read PFX
  // ----------------------------------------------------------

  const p12Buffer =
    fs.readFileSync(
      pfxPath
    );


  // ----------------------------------------------------------
  // STEP 3
  // Create signer
  // ----------------------------------------------------------

  const signer =
    new P12Signer(

      p12Buffer,

      {
        passphrase:
          password
      }

    );


  // ----------------------------------------------------------
  // STEP 4
  // Cryptographically sign
  // ----------------------------------------------------------

  const signedPdf =
    await new SignPdf().sign(

      pdfWithPlaceholder,

      signer

    );


  return signedPdf;
}


// ============================================================
// 5. HIGH LEVEL GLOBAL FUNCTION
// ============================================================
//
// THIS IS THE FUNCTION YOUR SERVICE WILL CALL.
//
// Now instead of sending pageNumber/widgetRect manually,
// send Puppeteer `page`.
//
// The global file automatically finds:
//
//     #signature-anchor
//
// ============================================================

async function digitallySignPdf({
  pdfBuffer,
  page,
  pfxPath,
  password,
  selector = "#signature-anchor",
}) {
  try {
    // -----------------------------------------
    // Validate PDF
    // -----------------------------------------
    if (!pdfBuffer) {
      throw new Error(
        "pdfBuffer is required. Generate PDF using page.pdf() before signing."
      );
    }

    if (!Buffer.isBuffer(pdfBuffer)) {
      pdfBuffer = Buffer.from(pdfBuffer);
    }

    if (pdfBuffer.length === 0) {
      throw new Error("PDF buffer is empty.");
    }

    // -----------------------------------------
    // Validate Puppeteer page
    // -----------------------------------------
    if (!page) {
      throw new Error(
        "Puppeteer page is required for automatic signature placement"
      );
    }

    // -----------------------------------------
    // Validate certificate
    // -----------------------------------------
    if (!pfxPath) {
      throw new Error("PFX path is required");
    }

    if (!fs.existsSync(pfxPath)) {
      throw new Error(`PFX file not found: ${pfxPath}`);
    }

    if (!password) {
      throw new Error("PFX password is required");
    }

    await page.evaluate(() => {

  const signatureText =
    document.querySelector(".digital-signature-text");

  if (signatureText) {
    signatureText.style.display = "block";
  }

});

    // -----------------------------------------
    // Find #signature-anchor
    // -----------------------------------------
    const placement = await locateSignatureWidget(
      page,
      selector
    );

    if (!placement) {
      throw new Error(
        `Signature anchor "${selector}" could not be located`
      );
    }

    console.log(
      "Digital signature placement:",
      placement
    );

    const {
      pageNumber,
      widgetRect
    } = placement;

    // -----------------------------------------
    // Create PDF signature placeholder
    // -----------------------------------------
    const pdfWithPlaceholder =
      await createVisibleSignature(
        pdfBuffer,
        pageNumber,
        widgetRect
      );

    // -----------------------------------------
    // Read PFX
    // -----------------------------------------
    const p12Buffer =
      fs.readFileSync(pfxPath);

    // -----------------------------------------
    // Create signer
    // -----------------------------------------
    const signer =
      new P12Signer(
        p12Buffer,
        {
          passphrase: password
        }
      );

    // -----------------------------------------
    // Cryptographically sign
    // -----------------------------------------
    const signedPdf =
      await new SignPdf().sign(
        pdfWithPlaceholder,
        signer
      );

    // -----------------------------------------
    // Get signer name
    // -----------------------------------------
    const signerName =
      extractSignerNameFromPfx(
        pfxPath,
        password
      );

    return {
      pdfBuffer: Buffer.from(signedPdf),
      signerName,
      pageNumber,
      widgetRect
    };

  } catch (error) {

    console.error(
      "GLOBAL DIGITAL SIGNATURE ERROR:",
      error
    );

    throw error;
  }
}


// ============================================================
// EXPORTS
// ============================================================



const A4_HEIGHT_PT = 842;

// Adjust these if the signature needs to move
const OFFSET_LEFT_PT = 0;
const OFFSET_UP_PT = 20;

// Detect our temporary marker
const isMarker = (r, g, b) => {
  return r > 200 && g < 60 && b > 200;
};

/**
 * Finds the actual PDF page and coordinates of the signature anchor.
 *
 * HTML:
 *
 * <div id="signature-anchor">
 *     Digital Signature
 * </div>
 *
 * Returns:
 *
 * {
 *   pageNumber: 2,
 *   widgetRect: [350, 120, 440, 210]
 * }
 */
async function locateSignatureWidget(
  page,
  selector = "#signature-anchor"
) {
  if (!page) {
    throw new Error(
      "Puppeteer page is required for automatic signature placement"
    );
  }

  // ---------------------------------------------------------
  // 1. Put temporary MAGENTA marker on signature anchor
  // ---------------------------------------------------------

  const hasAnchor = await page.evaluate((selector) => {

    const element = document.querySelector(selector);

    if (!element) {
      return false;
    }

    // Save original background
    element.dataset.previousBackground =
      element.style.background || "";

    // Temporary unique color
    element.style.background = "rgb(255,0,255)";

    return true;

  }, selector);

  if (!hasAnchor) {
    console.error(
      `Signature anchor not found: ${selector}`
    );

    return null;
  }

  // ---------------------------------------------------------
  // 2. Remove temporary marker
  // ---------------------------------------------------------

  const clearMarker = async () => {

    await page.evaluate((selector) => {

      const element =
        document.querySelector(selector);

      if (!element) {
        return;
      }

      element.style.background =
        element.dataset.previousBackground || "";

      delete element.dataset.previousBackground;

    }, selector);

  };

  let markedPdf;

  try {

    // -------------------------------------------------------
    // 3. Let Chrome perform REAL PDF pagination
    // -------------------------------------------------------

    markedPdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

  } finally {

    // VERY IMPORTANT:
    // marker must never remain in final PDF
    await clearMarker();

  }

  // ---------------------------------------------------------
  // 4. Load MuPDF
  // ---------------------------------------------------------

  let mupdf;

  try {

    mupdf = await import("mupdf");

  } catch (error) {

    console.error(
      "MuPDF is required for automatic signature placement."
    );

    console.error(error);

    return null;
  }

  // ---------------------------------------------------------
  // 5. Open generated PDF
  // ---------------------------------------------------------

  const document =
    mupdf.Document.openDocument(
      markedPdf,
      "application/pdf"
    );

  const pageCount =
    document.countPages();

  // Render PDF at 2x resolution
  const matrix =
    mupdf.Matrix.scale(
      RASTER_SCALE,
      RASTER_SCALE
    );

  // ---------------------------------------------------------
  // 6. Search from LAST page backwards
  // ---------------------------------------------------------

  for (
    let pageIndex = pageCount - 1;
    pageIndex >= 0;
    pageIndex--
  ) {

    const pdfPage =
      document.loadPage(pageIndex);

    const pixmap =
      pdfPage.toPixmap(
        matrix,
        mupdf.ColorSpace.DeviceRGB,
        false,
        false
      );

    const width =
      pixmap.getWidth();

    const height =
      pixmap.getHeight();

    const pixels =
      pixmap.getPixels();

    // Bounding box of marker
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;

    let markerPixelCount = 0;

    // -------------------------------------------------------
    // 7. Scan every pixel
    // -------------------------------------------------------

    for (
      let y = 0;
      y < height;
      y++
    ) {

      for (
        let x = 0;
        x < width;
        x++
      ) {

        const offset =
          (y * width + x) * 3;

        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];

        if (isMarker(r, g, b)) {

          markerPixelCount++;

          if (x < minX) {
            minX = x;
          }

          if (x > maxX) {
            maxX = x;
          }

          if (y < minY) {
            minY = y;
          }

          if (y > maxY) {
            maxY = y;
          }

        }

      }

    }

    // -------------------------------------------------------
    // 8. Marker found
    // -------------------------------------------------------

    if (markerPixelCount > 50) {

      // Marker center in image pixels
      const centerXPixel =
        (minX + maxX) / 2;

      const centerYPixel =
        (minY + maxY) / 2;

      // Convert pixels -> PDF points
      const centerXPt =
        centerXPixel / RASTER_SCALE;

      const centerYTopPt =
        centerYPixel / RASTER_SCALE;

      // PDF coordinate system starts
      // from BOTTOM LEFT.
      const centerYBottomPt =
        height / RASTER_SCALE -
        centerYTopPt;

      // -----------------------------------------------------
      // 9. Apply signature position adjustment
      // -----------------------------------------------------

      const adjustedCenterX =
        centerXPt -
        OFFSET_LEFT_PT;

      const adjustedCenterY =
        centerYBottomPt +
        OFFSET_UP_PT;

      // -----------------------------------------------------
      // 10. Create signature rectangle
      // -----------------------------------------------------

      const x1 = Math.round(
        adjustedCenterX -
        SIG_SIZE / 2
      );

      const y1 = Math.round(
        adjustedCenterY -
        SIG_SIZE / 2
      );

      const x2 =
        x1 + SIG_SIZE;

      const y2 =
        y1 + SIG_SIZE;

      const placement = {

        // Convert zero-based PDF page index
        // to one-based page number
        pageNumber:
          pageIndex + 1,

        widgetRect: [
          x1,
          y1,
          x2,
          y2
        ]

      };

      console.log(
        "Digital signature placement:",
        placement
      );

      return placement;
    }
  }

  // ---------------------------------------------------------
  // 11. Anchor wasn't detected
  // ---------------------------------------------------------

  console.error(
    `Could not detect signature anchor "${selector}" in PDF`
  );

  return null;
}

module.exports = {

  digitallySignPdf,

  signPdf,

  createVisibleSignature,

  extractSignerNameFromPfx,

  locateSignatureAnchor,

    locateSignatureWidget,
  A4_HEIGHT_PT

};