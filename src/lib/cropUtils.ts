import { CutLine, PanelCrop } from '../types';

/**
 * Perform high-resolution slice crops from an image based on cut lines.
 * Retains exact native pixel coordinates, avoiding any quality loss or distortion.
 */
export async function generatePanelCrops(
  img: HTMLImageElement,
  cutLines: CutLine[],
  pageIndex: number,
  isKeptIntact: boolean = false
): Promise<PanelCrop[]> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (origW <= 0 || origH <= 0) return [];

  // If page is kept intact or no cut lines exist, return 1 full page panel
  if (isKeptIntact || cutLines.length === 0) {
    const canvas = document.createElement('canvas');
    canvas.width = origW;
    canvas.height = origH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, origW, origH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.94)
    );

    return [
      {
        id: `page-${pageIndex}-full`,
        pageIndex,
        panelIndex: 1,
        box: { x: 0, y: 0, width: origW, height: origH },
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        blob: blob || undefined,
        type: 'full_page',
        description: 'Halaman Penuh (Utuh)',
      },
    ];
  }

  // Sort cut lines by yPixel ascending
  const sortedCuts = [...cutLines]
    .map((c) => Math.max(1, Math.min(origH - 1, Math.round(c.yPixel))))
    .sort((a, b) => a - b);

  // Eliminate cuts that are too close to each other or edges (< 60px apart)
  // to avoid creating tiny/thin slivers, merging them naturally with the previous slice.
  const dedupedCuts: number[] = [];
  for (const c of sortedCuts) {
    if (c < 60 || origH - c < 60) continue; // too close to top or bottom edge
    if (dedupedCuts.length === 0 || c - dedupedCuts[dedupedCuts.length - 1] >= 60) {
      dedupedCuts.push(c);
    }
  }

  const yBoundaries = [0, ...dedupedCuts, origH];
  const crops: PanelCrop[] = [];

  for (let i = 0; i < yBoundaries.length - 1; i++) {
    const yStart = yBoundaries[i];
    const yEnd = yBoundaries[i + 1];
    const sliceH = yEnd - yStart;

    if (sliceH <= 5) continue; // Skip near-zero slices

    const canvas = document.createElement('canvas');
    canvas.width = origW;
    canvas.height = sliceH;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Draw slice from source image
    ctx.drawImage(img, 0, yStart, origW, sliceH, 0, 0, origW, sliceH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.94)
    );

    crops.push({
      id: `page-${pageIndex}-panel-${i + 1}`,
      pageIndex,
      panelIndex: i + 1,
      box: { x: 0, y: yStart, width: origW, height: sliceH },
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      blob: blob || undefined,
      type: dedupedCuts.length >= 1 ? 'full_panel' : 'full_page',
      description: `Panel ${i + 1}`,
    });
  }

  return crops;
}
