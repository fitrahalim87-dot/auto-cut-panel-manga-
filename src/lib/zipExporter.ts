import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { MangaPage } from '../types';

export interface ZipExportProgress {
  percent: number;
  message: string;
  isCompleted: boolean;
}

/**
 * Packs all confirmed crops from manga pages into an organized ZIP archive.
 */
export async function exportPagesToZip(
  pages: MangaPage[],
  onProgress?: (progress: ZipExportProgress) => void
): Promise<void> {
  const zip = new JSZip();
  let totalPanels = 0;

  for (const page of pages) {
    totalPanels += page.panels.length;
  }

  if (totalPanels === 0) {
    throw new Error('Tidak ada panel hasil potongan yang dapat diekspor.');
  }

  onProgress?.({
    percent: 10,
    message: 'Mempersiapkan potongan panel...',
    isCompleted: false,
  });

  let processedCount = 0;
  let globalCounter = 1;

  // Pastikan urutan halaman terurut alami dari nama file sebelum diekspor
  const sortedPages = [...pages].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  for (let pageIdx = 0; pageIdx < sortedPages.length; pageIdx++) {
    const page = sortedPages[pageIdx];
    const pageNumStr = String(pageIdx + 1).padStart(3, '0');

    if (page.isKeptIntact || (page.panels.length === 1 && page.panels[0].type === 'full_page')) {
      // Halaman Utuh
      const panel = page.panels[0];
      const globalStr = String(globalCounter).padStart(3, '0');
      const filename = `${globalStr}_halaman${pageNumStr}_utuh.jpg`;
      globalCounter++;

      if (panel.blob) {
        zip.file(filename, panel.blob);
      } else if (panel.dataUrl) {
        const base64Data = panel.dataUrl.split(',')[1];
        zip.file(filename, base64Data, { base64: true });
      }

      processedCount++;
      const percent = 10 + Math.round((processedCount / totalPanels) * 75);
      onProgress?.({
        percent,
        message: `Menambahkan ${filename}...`,
        isCompleted: false,
      });
    } else {
      // Potongan Panel Terpisah
      for (let pIdx = 0; pIdx < page.panels.length; pIdx++) {
        const panel = page.panels[pIdx];
        const globalStr = String(globalCounter).padStart(3, '0');
        const panelNumStr = String(pIdx + 1).padStart(3, '0');
        const filename = `${globalStr}_halaman${pageNumStr}_panel${panelNumStr}.jpg`;
        globalCounter++;

        if (panel.blob) {
          zip.file(filename, panel.blob);
        } else if (panel.dataUrl) {
          const base64Data = panel.dataUrl.split(',')[1];
          zip.file(filename, base64Data, { base64: true });
        }

        processedCount++;
        const percent = 10 + Math.round((processedCount / totalPanels) * 75);
        onProgress?.({
          percent,
          message: `Menambahkan ${filename}...`,
          isCompleted: false,
        });
      }
    }
  }

  onProgress?.({
    percent: 90,
    message: 'Mengompresi file ZIP...',
    isCompleted: false,
  });

  const zipContent = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  onProgress?.({
    percent: 100,
    message: 'Selesai! Mengunduh berkas...',
    isCompleted: true,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipFilename = `AutoCut_Manga_${timestamp}.zip`;

  saveAs(zipContent, zipFilename);
}
