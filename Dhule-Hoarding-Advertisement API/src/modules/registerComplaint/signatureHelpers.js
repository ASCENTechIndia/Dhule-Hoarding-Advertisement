const { PDFDocument, PDFName, PDFHexString, PDFString } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const { SignPdf } = require("@signpdf/signpdf");
const { P12Signer } = require("@signpdf/signer-p12");
const forge = require("node-forge");

/**
 * Adds a visible digital signature widget to the PDF.
 * Appearance: yellow question mark with shadow and black signer details.
 */
async function createVisibleSignature(
  pdfBuffer,
  pageNumber,
  widgetRect,
  signerName = "" // kept for compatibility but not used in appearance
) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const page = pdfDoc.getPage(pageNumber - 1);
  const pageRef = page.ref;

  // --- Annots array ---
  let annots = page.node.get(PDFName.of("Annots"));
  if (!annots) {
    annots = pdfDoc.context.obj([]);
    page.node.set(PDFName.of("Annots"), annots);
  } else {
    annots = pdfDoc.context.lookup(annots);
  }

  // --- Fonts (Helv, ZaDb) ---
  const HelvDict = pdfDoc.context.obj({
    Type: "Font",
    Subtype: "Type1",
    BaseFont: "Helvetica",
    Encoding: "WinAnsiEncoding",
  });
  const HelvRef = pdfDoc.context.register(HelvDict);

  const ZaDbDict = pdfDoc.context.obj({
    Type: "Font",
    Subtype: "Type1",
    BaseFont: "ZapfDingbats",
  });
  const ZaDbRef = pdfDoc.context.register(ZaDbDict);

  const fontDict = pdfDoc.context.obj({ Helv: HelvRef, ZaDb: ZaDbRef });
  const fontDictRef = pdfDoc.context.register(fontDict);

  // --- AcroForm ---
  let acroForm = pdfDoc.catalog.get(PDFName.of("AcroForm"));
  let acroFormDict;
  if (!acroForm) {
    acroFormDict = pdfDoc.context.obj({
      Fields: [],
      SigFlags: 3,
      DR: { Font: fontDictRef },
      DA: PDFString.of("/Helv 0 Tf 0 g"),
    });
    pdfDoc.catalog.set(
      PDFName.of("AcroForm"),
      pdfDoc.context.register(acroFormDict)
    );
  } else {
    acroFormDict = pdfDoc.context.lookup(acroForm);
    if (!acroFormDict.get(PDFName.of("SigFlags"))) {
      acroFormDict.set(PDFName.of("SigFlags"), pdfDoc.context.obj(3));
    }
    let dr = acroFormDict.get(PDFName.of("DR"));
    if (!dr) {
      acroFormDict.set(
        PDFName.of("DR"),
        pdfDoc.context.obj({ Font: fontDictRef })
      );
    } else {
      dr = pdfDoc.context.lookup(dr);
      let font = dr.get(PDFName.of("Font"));
      if (!font) dr.set(PDFName.of("Font"), fontDictRef);
    }
    if (!acroFormDict.get(PDFName.of("DA"))) {
      acroFormDict.set(PDFName.of("DA"), PDFString.of("/Helv 0 Tf 0 g"));
    }
  }

  // --- Fields array ---
  let fields = acroFormDict.get(PDFName.of("Fields"));
  if (!fields) {
    fields = pdfDoc.context.obj([]);
    acroFormDict.set(PDFName.of("Fields"), fields);
  } else {
    fields = pdfDoc.context.lookup(fields);
  }

  // --- Widget dimensions ---
  const [x1, y1, x2, y2] = widgetRect;
  const width = x2 - x1;
  const height = y2 - y1;

  // --- Graphics state for transparency ---
  const gsDict = pdfDoc.context.obj({
    Type: "ExtGState",
    ca: 0.4,
    CA: 0.4,
    BM: "Normal",
  });
  const gsRef = pdfDoc.context.register(gsDict);

  // --- Appearance layers (n0–n4) ---
  const n0Dict = pdfDoc.context.obj({
    Type: "XObject",
    Subtype: "Form",
    BBox: [0, 0, width, height],
    Resources: { Font: fontDictRef },
  });
  const n0Stream = pdfDoc.context.stream("", n0Dict);
  const n0Ref = pdfDoc.context.register(n0Stream);

  const n1Dict = pdfDoc.context.obj({
    Type: "XObject",
    Subtype: "Form",
    BBox: [0, 0, width, height],
    Resources: { Font: fontDictRef },
  });
  const n1Stream = pdfDoc.context.stream("", n1Dict);
  const n1Ref = pdfDoc.context.register(n1Stream);

  const n2Dict = pdfDoc.context.obj({
    Type: "XObject",
    Subtype: "Form",
    BBox: [0, 0, 0, 0],
    Resources: { Font: fontDictRef },
  });
  const n2Stream = pdfDoc.context.stream("q Q", n2Dict);
  const n2Ref = pdfDoc.context.register(n2Stream);

  // --- n3: visible signature appearance (yellow question mark) ---
  const n3Dict = pdfDoc.context.obj({
    Type: "XObject",
    Subtype: "Form",
    BBox: [0, 0, width, height],
    Resources: { Font: fontDictRef },
  });

  // Use the icon as a translucent background watermark for the text.
  const size = Math.min(100, height);
  const scale = size / 100; // original coordinates are in 0–100 space
  const dx = width - size;
  const dy = (height - size) / 2;

  // Original question mark drawing (with shadow)
  const n3Path = `
q
${scale.toFixed(4)} 0 0 ${scale.toFixed(4)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm

% Shadow (dark golden-grey, offset -2, -2)
0.65 0.55 0.20 rg
% Dot shadow
42 22 12 12 re f
% Body shadow
44 31 m
44 41 l
44 41 48 51 56 61 c
56 61 56 71 48 71 c
48 71 38 71 34 57 c
24 61 l
24 61 24 75 48 85 c
48 85 72 85 72 63 c
72 63 72 41 56 41 c
56 31 l
44 31 l
h
f

% Main question mark (bright yellow fill, dark gold stroke)
0.95 0.82 0.20 rg
0.60 0.50 0.15 RG
1.5 w
% Dot
44 24 12 12 re B
% Body
46 44 m
46 53 l
46 53 50 53 58 63 c
58 63 58 73 50 73 c
50 73 40 73 36 59 c
26 63 l
26 63 26 77 50 87 c
50 87 74 87 74 65 c
74 65 74 43 58 43 c
58 33 l
46 44 l
h
B

Q
`;

  const n3Stream = pdfDoc.context.stream(n3Path, n3Dict);
  const n3Ref = pdfDoc.context.register(n3Stream);

  // --- n4: empty ---
  const n4Dict = pdfDoc.context.obj({
    Type: "XObject",
    Subtype: "Form",
    BBox: [0, 0, width, height],
    Resources: { Font: fontDictRef },
  });
  const escapePdfText = (value) =>
    String(value).replace(/([\\()])/g, "\\$1");
  const displayName = signerName || "DS Dhule Municipal Corporation";
  const signingDate = new Date().toISOString().slice(0, 19).replace("T", " ");
  const n4Path = `
BT
/Helv 5 Tf
0 0 0 rg
88 ${height - 25} Td
(Digitally signed by ${escapePdfText(displayName)}) Tj
0 -11 Td
(Date and time: ${escapePdfText(signingDate)}) Tj
ET
`;
  const n4Stream = pdfDoc.context.stream(n4Path, n4Dict);
  const n4Ref = pdfDoc.context.register(n4Stream);

  // --- Normal appearance ---
  const normalAppearanceDict = pdfDoc.context.obj({
    Type: "XObject",
    Subtype: "Form",
    BBox: [0, 0, width, height],
    Resources: {
      XObject: { n0: n0Ref, n1: n1Ref, n2: n2Ref, n3: n3Ref, n4: n4Ref },
      ExtGState: { GS0: gsRef },
      Font: fontDictRef,
    },
  });
  const normalAppearanceStream = pdfDoc.context.stream(
    `q 1 0 0 1 0 0 cm /n0 Do Q ` +
    `q /GS0 gs 1 0 0 1 0 0 cm /n1 Do Q ` +
    `q /GS0 gs 1 0 0 1 0 0 cm /n3 Do Q ` +
    `q /GS0 gs 1 0 0 1 0 0 cm /n4 Do Q`,
    normalAppearanceDict
  );
  const normalAppearanceRef = pdfDoc.context.register(normalAppearanceStream);

  // --- Signature dictionary ---
  const signatureDict = pdfDoc.context.obj({
    Type: "Sig",
    Filter: "Adobe.PPKLite",
    SubFilter: "adbe.pkcs7.detached",
    Name: PDFString.of(signerName || "DS Dhule Municipal Corporation"),
    M: PDFString.of(
      `D:${new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z")
        .replace("T", "")}`
    ),
    ByteRange: [0, PDFName.of("**********"), PDFName.of("**********"), PDFName.of("**********")],
    Contents: PDFHexString.of("A".repeat(15000)),
  });
  const signatureDictRef = pdfDoc.context.register(signatureDict);

  // --- Widget dictionary ---
  const widgetDict = pdfDoc.context.obj({
    Type: "Annot",
    Subtype: "Widget",
    FT: "Sig",
    T: PDFString.of("Signature1"),
    Rect: [x1, y1, x2, y2],
    V: signatureDictRef,
    F: 4,
    P: pageRef,
    AP: { N: normalAppearanceRef },
    MK: {
      TP: 1,
      BG: [1, 1, 1],
      BC: [1, 1, 1],
    },
    DA: PDFString.of("/Helv 0 Tf 0 0 0 rg"),
  });
  const widgetRef = pdfDoc.context.register(widgetDict);

  // --- Link to page and form ---
  annots.push(widgetRef);
  fields.push(widgetRef);

  // --- Save ---
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return Buffer.from(pdfBytes);
}

/**
 * Sign the PDF with the PFX certificate.
 */
async function signPdf(pdfBuffer, pfxPath, password, pageNumber, widgetRect, signerName = "") {
  const pdfWithPlaceholder = await createVisibleSignature(
    pdfBuffer,
    pageNumber,
    widgetRect,
    signerName || "" // not used in appearance, but kept for compatibility
  );

  const p12Buffer = fs.readFileSync(pfxPath);
  const signer = new P12Signer(p12Buffer, { passphrase: password });
  const signedPdf = await new SignPdf().sign(pdfWithPlaceholder, signer);
  return signedPdf;
}

/**
 * Extract the Common Name (CN) from the PFX certificate.
 */
function extractSignerNameFromPfx(pfxPath, password) {
  try {
    const p12Buffer = fs.readFileSync(pfxPath);
    const p12Der = forge.util.createBuffer(p12Buffer.toString("binary"));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    for (const safeContent of p12.safeContents) {
      for (const safeBag of safeContent.safeBags) {
        if (safeBag.cert) {
          const cn = safeBag.cert.subject.attributes.find((attr) => attr.shortName === "CN");
          return cn ? cn.value : "";
        }
      }
    }
    return "";
  } catch (err) {
    console.error("PFX Read Error:", err);
    return "";
  }
}

module.exports = {
  createVisibleSignature,
  signPdf,
  extractSignerNameFromPfx,
};