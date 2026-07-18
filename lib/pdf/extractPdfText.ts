import type { PDFDocumentProxy } from "pdfjs-dist";

export interface PdfTextResult { text: string; pages: number }

export async function extractPdfText(file: File, signal?: AbortSignal): Promise<PdfTextResult> {
  if (typeof window === "undefined") throw new Error("PDF.js solo puede ejecutarse en el navegador.");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  let document: PDFDocumentProxy | undefined;
  try {
    const buffer = await file.arrayBuffer();
    if (signal?.aborted) throw new DOMException("Procesamiento cancelado", "AbortError");
    document = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pageTexts: string[] = [];
    for (let index = 1; index <= document.numPages; index += 1) {
      if (signal?.aborted) throw new DOMException("Procesamiento cancelado", "AbortError");
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
      page.cleanup();
    }
    return { text: pageTexts.join("\n"), pages: document.numPages };
  } finally {
    if (document) await document.destroy();
  }
}
