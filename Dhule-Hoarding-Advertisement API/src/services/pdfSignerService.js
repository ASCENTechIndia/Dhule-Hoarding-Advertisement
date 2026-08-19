const fs = require("fs");
const path = require("path");

const { SignPdf } = require("@signpdf/signpdf");
const { P12Signer } = require("@signpdf/signer-p12");
const {
  plainAddPlaceholder,
} = require("@signpdf/placeholder-plain");


async function signPdfWithPfx(
  pdfBuffer,
  options = {}
) {

  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new Error(
      "PDF buffer is required"
    );
  }


  // =====================================================
  // CERTIFICATE
  // =====================================================

  const pfxPath = path.resolve(
    process.env.PFX_PATH
  );

  const pfxPassword =
    process.env.PFX_PASSWORD;


  console.log(
    "PFX path:",
    pfxPath
  );


  if (!fs.existsSync(pfxPath)) {

    throw new Error(
      `PFX certificate not found: ${pfxPath}`
    );
  }


  if (!pfxPassword) {

    throw new Error(
      "PFX_PASSWORD is not configured"
    );
  }


  // =====================================================
  // READ PFX
  // =====================================================

  const p12Buffer =
    fs.readFileSync(
      pfxPath
    );


  console.log(
    "PFX loaded successfully"
  );


  // =====================================================
  // ADD SIGNATURE PLACEHOLDER
  // =====================================================

  const pdfWithPlaceholder =
    plainAddPlaceholder({

      pdfBuffer,

      reason:
        options.reason ||
        "Notice digitally signed",

      contactInfo:
        options.contactInfo ||
        "",

      name:
        options.name ||
        "Authorized Officer",

      location:
        options.location ||
        "Dhule Municipal Corporation",

      signatureLength:
        16000,
    });


  // =====================================================
  // P12 SIGNER
  // =====================================================

  const signer =
    new P12Signer(
      p12Buffer,
      {
        passphrase:
          pfxPassword,
      }
    );


  // =====================================================
  // SIGN PDF
  // =====================================================

  const signPdf =
    new SignPdf();


  const signedPdf =
    await signPdf.sign(
      pdfWithPlaceholder,
      signer
    );


  if (
    !Buffer.isBuffer(
      signedPdf
    )
  ) {

    throw new Error(
      "Signed PDF is not a Buffer"
    );
  }


  console.log(
    "PDF signed successfully"
  );

  console.log(
    "Original PDF size:",
    pdfBuffer.length
  );

  console.log(
    "Signed PDF size:",
    signedPdf.length
  );


  return signedPdf;
}


module.exports = {
  signPdfWithPfx,
};