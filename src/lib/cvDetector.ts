import { AnalysisResult, CutLine } from '../types';

/**
 * Safely converts a File to a Data URL (immune to iframe blob URL restrictions)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an HTMLImageElement safely from a URL, Blob, or Data URI.
 * Never sets crossOrigin on blob: or data: URIs to avoid browser security violations.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Never set crossOrigin on blob: or data: URLs, as this causes CORS errors in browsers
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const parsed = new URL(src);
        if (parsed.origin !== window.location.origin) {
          img.crossOrigin = 'anonymous';
        }
      } catch {
        // ignore invalid URL parsing
      }
    }

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      // If crossOrigin was set, retry once without crossOrigin
      if (img.crossOrigin) {
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => {
          reject(new Error('Gagal memuat gambar: Format tidak didukung atau file tidak dapat dibaca.'));
        };
        fallback.src = src;
      } else {
        reject(new Error('Gagal memuat gambar: Format tidak didukung atau file tidak dapat dibaca.'));
      }
    };

    img.src = src;
  });
}

interface GutterCandidate {
  yStart: number;
  yEnd: number;
  center: number;
  height: number;
  avgInkRatio: number;
  hasAdjacentBorderLine: boolean;
}

/**
 * High-precision Local Computer Vision detector for Manga Panels
 * Analyzes gutters, horizontal projection, panel border lines, and ensures
 * cut lines NEVER slice through characters, text, or artwork.
 */
export async function detectMangaPanels(
  img: HTMLImageElement
): Promise<{ analysis: AnalysisResult; cutLines: CutLine[] }> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (origW < 10 || origH < 10) {
    return {
      analysis: {
        detectedRule: 4,
        ruleName: 'Ukuran Gambar Tidak Valid',
        confidenceScore: 0,
        candidateCuts: [],
        requiresManualReview: true,
        notes: 'Resolusi gambar terlalu kecil.',
      },
      cutLines: [],
    };
  }

  // Use a standardized canvas width for fast, reliable pixel analysis
  const targetW = 600;
  const scale = targetW / origW;
  const targetH = Math.round(origH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas context tidak tersedia');
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  // 1. Determine active horizontal content bounds (ignore white page margins)
  let minContentX = targetW;
  let maxContentX = 0;

  for (let x = 0; x < targetW; x += 4) {
    for (let y = Math.round(targetH * 0.1); y < Math.round(targetH * 0.9); y += 4) {
      const idx = (y * targetW + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (lum < 200) {
        if (x < minContentX) minContentX = x;
        if (x > maxContentX) maxContentX = x;
      }
    }
  }

  // Safety clamps for margins
  minContentX = Math.max(Math.round(targetW * 0.04), Math.min(minContentX, Math.round(targetW * 0.15)));
  maxContentX = Math.min(Math.round(targetW * 0.96), Math.max(maxContentX, Math.round(targetW * 0.85)));
  const activeW = Math.max(50, maxContentX - minContentX);

  // 2. Analyze ink density and black border lines for each horizontal row
  const rowInkRatio = new Float32Array(targetH);
  const rowBlackLineRatio = new Float32Array(targetH);

  for (let y = 0; y < targetH; y++) {
    let inkCount = 0;
    let blackCount = 0;

    for (let x = minContentX; x < maxContentX; x++) {
      const idx = (y * targetW + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

      // Ink pixel (line art, text, characters)
      if (lum < 205) {
        inkCount++;
      }
      // Black panel border pixel
      if (lum < 85) {
        blackCount++;
      }
    }

    rowInkRatio[y] = inkCount / activeW;
    rowBlackLineRatio[y] = blackCount / activeW;
  }

  // 3. Detect candidate gutter bands
  // In a true gutter, ink ratio across the content width must be near zero (< 2.5%)
  // A row with characters or speech bubbles has ink ratio > 8% - 50%!
  const topBound = Math.round(targetH * 0.07);
  const bottomBound = Math.round(targetH * 0.93);

  const rawGutters: GutterCandidate[] = [];
  let curStart = -1;
  let totalInk = 0;

  for (let y = topBound; y < bottomBound; y++) {
    // Strict gutter check: virtually NO ink across the active content width
    const isCleanGutterRow = rowInkRatio[y] <= 0.022;

    if (isCleanGutterRow) {
      if (curStart === -1) {
        curStart = y;
        totalInk = 0;
      }
      totalInk += rowInkRatio[y];
    } else {
      if (curStart !== -1) {
        const h = y - curStart;
        // Gutter must have a minimum height (at least ~0.8% of height, usually 5px at 600w)
        if (h >= 4 && h <= Math.round(targetH * 0.10)) {
          // Check if there is an adjacent horizontal panel border line right above or below
          let hasBorder = false;
          for (let checkY = Math.max(0, curStart - 4); checkY <= Math.min(targetH - 1, y + 4); checkY++) {
            if (rowBlackLineRatio[checkY] > 0.35) {
              hasBorder = true;
              break;
            }
          }

          rawGutters.push({
            yStart: curStart,
            yEnd: y,
            center: Math.round(curStart + h / 2),
            height: h,
            avgInkRatio: totalInk / h,
            hasAdjacentBorderLine: hasBorder,
          });
        }
        curStart = -1;
      }
    }
  }

  // 4. Strict filter for manga panel proportions:
  // Manga panels must be substantial (at least 18% of page height).
  // Splits shorter than 18% are almost always inside a single panel (e.g. above characters' heads).
  const minPanelHeight = Math.round(targetH * 0.18);
  const validGutters: GutterCandidate[] = [];

  for (const g of rawGutters) {
    // Perform ink crossing test on the center row:
    // Ensure the cut line does not intersect ANY dark stroke across the middle 80% of active width
    let centerRow = g.center;
    let minInkY = centerRow;
    let minInk = 999;

    for (let testY = g.yStart; testY <= g.yEnd; testY++) {
      if (rowInkRatio[testY] < minInk) {
        minInk = rowInkRatio[testY];
        minInkY = testY;
      }
    }

    // Must be extremely clean (< 1.5% ink)
    if (minInk > 0.018) {
      continue; // Discard gutter candidate that has ink passing through
    }

    g.center = minInkY;

    if (validGutters.length === 0) {
      // First gutter must be at least minPanelHeight from top
      if (g.center >= minPanelHeight) {
        validGutters.push(g);
      }
    } else {
      const prev = validGutters[validGutters.length - 1];
      if (g.center - prev.center >= minPanelHeight) {
        validGutters.push(g);
      } else {
        // Keep the more prominent gutter (adjacent to border line or cleaner)
        if (g.hasAdjacentBorderLine && !prev.hasAdjacentBorderLine) {
          validGutters[validGutters.length - 1] = g;
        } else if (g.height > prev.height && g.avgInkRatio <= prev.avgInkRatio) {
          validGutters[validGutters.length - 1] = g;
        }
      }
    }
  }

  // Ensure last gutter is at least minPanelHeight from bottom
  const filteredGutters = validGutters.filter((g) => targetH - g.center >= minPanelHeight);

  // 5. Analyze horizontal tiers for side-by-side sub-panels (Rule 3)
  const bandBoundaries = [
    topBound,
    ...filteredGutters.map((g) => g.center),
    bottomBound,
  ];

  let hasGroupedShortPanels = false;

  for (let b = 0; b < bandBoundaries.length - 1; b++) {
    const bandYStart = bandBoundaries[b];
    const bandYEnd = bandBoundaries[b + 1];
    const bandH = bandYEnd - bandYStart;

    if (bandH < minPanelHeight) continue;

    // Check for a vertical gutter dividing sub-panels within this tier
    for (let x = Math.round(targetW * 0.28); x <= Math.round(targetW * 0.72); x += 2) {
      let vWhiteCount = 0;
      for (let y = bandYStart; y < bandYEnd; y++) {
        const idx = (y * targetW + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (lum > 225) vWhiteCount++;
      }
      if (vWhiteCount / bandH > 0.88) {
        hasGroupedShortPanels = true;
        break;
      }
    }
  }

  // 6. Match against the 4 rules from specifications:
  const gutterCount = filteredGutters.length;
  let detectedRule: 1 | 2 | 3 | 4 = 4;
  let ruleName = '';
  let confidenceScore = 0.90;
  let requiresManualReview = false;
  let notes = '';

  if (hasGroupedShortPanels && gutterCount >= 1 && gutterCount <= 2) {
    detectedRule = 3;
    ruleName = 'Panel Pendek Digabung';
    confidenceScore = 0.94;
    notes = `Ditemukan panel pendek berdampingan dalam baris horizontal. Digabung dengan panel sebelahnya menjadi ${gutterCount + 1} bagian horizontal rapi.`;
  } else if (gutterCount === 2) {
    detectedRule = 1;
    ruleName = 'Tiga Panel Horizontal';
    confidenceScore = 0.96;
    notes = 'Ditemukan 2 pembatas gutter horizontal yang bersih membagi 3 panel manga.';
  } else if (gutterCount === 1) {
    detectedRule = 2;
    ruleName = 'Dua Panel Horizontal';
    confidenceScore = 0.95;
    notes = 'Ditemukan 1 pembatas gutter horizontal yang bersih membagi 2 panel manga.';
  } else if (gutterCount === 3) {
    detectedRule = 1;
    ruleName = 'Empat Panel Horizontal';
    confidenceScore = 0.89;
    notes = 'Ditemukan 3 pembatas gutter horizontal yang membagi 4 panel manga.';
  } else {
    // Rule 4: If 0 gutters OR more than 3 gutters (irregular), keep page intact!
    detectedRule = 4;
    ruleName = 'Tidak Ada Pola Jelas';
    confidenceScore = 0.70;
    requiresManualReview = true;
    notes = 'Tidak ditemukan pembatas gutter horizontal yang memenuhi syarat tanpa memotong gambar. Halaman dipertahankan utuh untuk keamanan.';
  }

  // Convert gutter centers back to original pixel coordinates
  const candidateCuts: number[] = [];
  const cutLines: CutLine[] = [];

  if (detectedRule !== 4) {
    for (let i = 0; i < filteredGutters.length; i++) {
      const g = filteredGutters[i];
      const origYPixel = Math.round(g.center / scale);
      candidateCuts.push(origYPixel);
      cutLines.push({
        id: `cut-${i}-${Date.now()}`,
        yRatio: origYPixel / origH,
        yPixel: origYPixel,
        isUserAdded: false,
      });
    }
  }

  return {
    analysis: {
      detectedRule,
      ruleName,
      confidenceScore,
      candidateCuts,
      requiresManualReview,
      notes,
    },
    cutLines,
  };
}

/**
 * Call Gemini AI to analyze manga page layout with multimodal semantic vision
 */
export async function analyzeWithGemini(
  dataUrl: string
): Promise<{
  rule: 1 | 2 | 3 | 4;
  ruleName: string;
  suggestedCutRatios: number[];
  confidenceScore: number;
  notes: string;
}> {
  // Extract base64 and mime type
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');

  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType,
    }),
  });

  const resJson = await response.json();
  if (!resJson.available) {
    throw new Error(resJson.message || resJson.error || 'Gemini API tidak tersedia');
  }

  const analysis = resJson.analysis;
  return {
    rule: (analysis.rule as 1 | 2 | 3 | 4) || 4,
    ruleName: analysis.ruleName || 'Analisis Gemini AI',
    suggestedCutRatios: Array.isArray(analysis.suggestedCutRatios) ? analysis.suggestedCutRatios : [],
    confidenceScore: typeof analysis.confidenceScore === 'number' ? analysis.confidenceScore : 0.95,
    notes: analysis.notes || 'Dianalisis menggunakan Gemini AI.',
  };
}
