/* Text extraction for resume import. Libraries are dynamically imported so
   they only load when an import actually happens. */

export async function extractPdfText(buf: Buffer): Promise<string> {
  // pdf-parse v2 exposes a class-based API off the package root
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const out = await parser.getText();
  return out.text || "";
}

export async function extractDocxText(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const out = await mammoth.extractRawText({ buffer: buf });
  return out.value || "";
}


/**
 * Cheap format checks from the file's own bytes.
 *
 * The declared name and MIME type come from the browser and are trivially
 * wrong — a renamed executable arrives as "cv.pdf", application/pdf. Without
 * this the extractor returns nothing, and the import silently produces an
 * empty résumé, which on the free plan also consumes the user's only slot.
 */
export function looksLikePdf(buf: Buffer): boolean {
  return buf.length > 4 && buf.subarray(0, 5).toString('latin1') === '%PDF-';
}

/** DOCX is a zip; every zip starts with "PK\x03\x04". */
export function looksLikeDocx(buf: Buffer): boolean {
  return buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}
