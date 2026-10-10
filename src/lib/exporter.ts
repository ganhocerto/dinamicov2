import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { OfficialModel, Plaque } from '../types';
import { getPlaqueBlob, getPlaqueDataUrl } from './canvasRenderer';

/**
 * Downloads a Blob directly to the client browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports a single plaque as a high-resolution PNG file
 */
export async function exportSinglePlaquePng(
  plaque: Plaque,
  model: OfficialModel
): Promise<void> {
  const blob = await getPlaqueBlob({ plaque, model });
  const filename = `DINAMICO-PRO-${plaque.numberFormatted}.png`;
  downloadBlob(blob, filename);
}

/**
 * Exports an entire batch as a ZIP archive containing all PNGs
 */
export async function exportBatchZip(
  plaques: Plaque[],
  model: OfficialModel,
  batchName: string = 'LOTE',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(`DINAMICO-PRO-${batchName.toUpperCase().replace(/\s+/g, '_')}`) || zip;

  const total = plaques.length;
  for (let i = 0; i < total; i++) {
    const plaque = plaques[i];
    if (onProgress) onProgress(i + 1, total);

    const blob = await getPlaqueBlob({ plaque, model });
    const filename = `DINAMICO-PRO-${plaque.numberFormatted}.png`;
    folder.file(filename, blob);
  }

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `DINAMICO-PRO-${batchName.toUpperCase().replace(/\s+/g, '_')}.zip`;
  downloadBlob(content, zipFilename);
}

/**
 * Exports a batch of plaques to print-ready A4 PDF
 * Sheet dimensions: 210 x 297 mm
 * Grid: 2 columns x 2 rows = 4 plaques per page
 * Plaque size: exactly 100 x 100 mm (10 x 10 cm)
 * Left margin: 5 mm (2x100 = 200 mm out of 210 mm)
 * Top margin: 48.5 mm (2x100 = 200 mm out of 297 mm, perfectly centered)
 */
export async function exportBatchPdfA4(
  plaques: Plaque[],
  model: OfficialModel,
  batchName: string = 'LOTE',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Create jsPDF in portrait A4 (mm units)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const plaqueSize = 100; // 100mm = 10cm
  const marginLeft = 5; // (210 - 200) / 2 = 5mm
  const marginTop = 48.5; // (297 - 200) / 2 = 48.5mm
  const colCount = 2;
  const rowCount = 2;
  const plaquesPerPage = colCount * rowCount; // 4

  const total = plaques.length;
  const totalPages = Math.ceil(total / plaquesPerPage);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    // Sheet header with trim info & batch title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `DINÂMICO PRO | Lote: ${batchName} | Modelo: ${model.name} | Pág. ${pageIdx + 1}/${totalPages} | Plaquinhas 10x10 cm`,
      marginLeft,
      20
    );

    // Subtle crop marks on outer boundary
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    // Outer perimeter crop guides
    doc.rect(marginLeft, marginTop, 200, 200);
    // Cross guide in the middle
    doc.line(marginLeft, marginTop + plaqueSize, marginLeft + 200, marginTop + plaqueSize);
    doc.line(marginLeft + plaqueSize, marginTop, marginLeft + plaqueSize, marginTop + 200);

    const startIdx = pageIdx * plaquesPerPage;
    const endIdx = Math.min(startIdx + plaquesPerPage, total);

    for (let i = startIdx; i < endIdx; i++) {
      const plaque = plaques[i];
      if (onProgress) onProgress(i + 1, total);

      const slotIdx = i - startIdx;
      const col = slotIdx % colCount;
      const row = Math.floor(slotIdx / colCount);

      const x = marginLeft + col * plaqueSize;
      const y = marginTop + row * plaqueSize;

      // Render high-res image data URL for plaque
      const dataUrl = await getPlaqueDataUrl({ plaque, model });
      doc.addImage(dataUrl, 'PNG', x, y, plaqueSize, plaqueSize, undefined, 'FAST');
    }
  }

  const pdfFilename = `DINAMICO-PRO-${batchName.toUpperCase().replace(/\s+/g, '_')}-A4.pdf`;
  doc.save(pdfFilename);
}
