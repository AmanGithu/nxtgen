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
