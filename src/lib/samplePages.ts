/**
 * Utility to generate test manga pages directly on Canvas to test:
 * Case 1: 3 Horizontal Panels
 * Case 2: 2 Horizontal Panels
 * Case 3: Short panels side-by-side (Grouped)
 * Case 4: Complex diagonal / overlapping panels (Kept intact)
 */

function createMangaCanvas(
  width: number = 800,
  height: number = 1200
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // White manga page background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  return { canvas, ctx };
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string
) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

function drawPanelArt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  artType: 'face' | 'scenery' | 'action'
) {
  ctx.save();
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(x, y, w, h);

  // Screentone / gradient
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#E5E7EB');
  grad.addColorStop(1, '#9CA3AF');
  ctx.fillStyle = grad;
  ctx.fillRect(x + 10, y + 10, w - 20, h - 20);

  // Speedlines / manga style details
  ctx.strokeStyle = '#4B5563';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 20 + i * (w / 9), y + h - 15);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.stroke();
  }

  // Panel border
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);

  // Label banner
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x + 15, y + 15, 140, 26);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 25, y + 28);

  ctx.restore();
}

/**
 * Generates Case 1: 3 clean horizontal panels with clear gutters
 */
export async function createCase1Page(): Promise<File> {
  const { canvas, ctx } = createMangaCanvas();
  const w = canvas.width;
  const marginX = 40;
  const panelW = w - marginX * 2;
  const gutterH = 26; // Clear white gutter

  const topH = 340;
  const midH = 360;
  const botH = 340;

  let curY = 50;

  // Panel 1
  drawPanelArt(ctx, marginX, curY, panelW, topH, 'Panel 1 (Atas)', 'face');
  drawSpeechBubble(ctx, marginX + panelW - 160, curY + 60, 120, 60, '...');
  curY += topH + gutterH;

  // Panel 2
  drawPanelArt(ctx, marginX, curY, panelW, midH, 'Panel 2 (Tengah)', 'scenery');
  drawSpeechBubble(ctx, marginX + 40, curY + 60, 140, 60, 'Pemandangan ini...');
  curY += midH + gutterH;

  // Panel 3
  drawPanelArt(ctx, marginX, curY, panelW, botH, 'Panel 3 (Bawah)', 'face');
  drawSpeechBubble(ctx, marginX + 40, curY + 70, 130, 60, 'Indah sekali.');

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], '01_tiga_panel_horizontal.png', { type: 'image/png' });
}

/**
 * Generates Case 2: 2 clean horizontal panels
 */
export async function createCase2Page(): Promise<File> {
  const { canvas, ctx } = createMangaCanvas();
  const w = canvas.width;
  const marginX = 40;
  const panelW = w - marginX * 2;
  const gutterH = 30;

  const topH = 520;
  const botH = 520;

  let curY = 50;

  // Panel 1
  drawPanelArt(ctx, marginX, curY, panelW, topH, 'Panel 1 (Atas)', 'face');
  drawSpeechBubble(ctx, marginX + panelW - 170, curY + 90, 130, 70, 'Ayo lanjut.');
  curY += topH + gutterH;

  // Panel 2
  drawPanelArt(ctx, marginX, curY, panelW, botH, 'Panel 2 (Bawah)', 'scenery');
  drawSpeechBubble(ctx, marginX + panelW - 160, curY + 80, 120, 65, 'Baik.');

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], '02_dua_panel_horizontal.png', { type: 'image/png' });
}

/**
 * Generates Case 3: Panel pendek digabung
 * (Top full panel, Middle has 2 short side-by-side subpanels, Bottom full panel)
 */
export async function createCase3Page(): Promise<File> {
  const { canvas, ctx } = createMangaCanvas();
  const w = canvas.width;
  const marginX = 40;
  const panelW = w - marginX * 2;
  const gutterH = 26;

  let curY = 50;

  // Top full panel
  const topH = 320;
  drawPanelArt(ctx, marginX, curY, panelW, topH, 'Panel 1 (Atas)', 'face');
  drawSpeechBubble(ctx, marginX + panelW - 150, curY + 50, 110, 55, 'Hmm...');
  curY += topH + gutterH;

  // Middle: 2 short panels side-by-side
  const midH = 360;
  const vGutterW = 20;
  const subW1 = Math.round((panelW - vGutterW) * 0.38);
  const subW2 = panelW - vGutterW - subW1;

  drawPanelArt(ctx, marginX, curY, subW1, midH, 'Sub-panel Kiri', 'face');
  drawSpeechBubble(ctx, marginX + 25, curY + 60, 105, 50, 'Jadi begitu...');

  drawPanelArt(ctx, marginX + subW1 + vGutterW, curY, subW2, midH, 'Sub-panel Kanan', 'scenery');
  curY += midH + gutterH;

  // Bottom full panel
  const botH = 340;
  drawPanelArt(ctx, marginX, curY, panelW, botH, 'Panel 3 (Bawah)', 'scenery');
  drawSpeechBubble(ctx, marginX + panelW - 160, curY + 60, 120, 60, 'Menarik juga.');

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], '03_panel_pendek_digabung.png', { type: 'image/png' });
}

/**
 * Generates Case 4: Complex / overlapping / diagonal panels (No clear horizontal pattern)
 */
export async function createCase4Page(): Promise<File> {
  const { canvas, ctx } = createMangaCanvas();
  const w = canvas.width;
  const h = canvas.height;

  // Complex diagonal bleeding composition
  ctx.save();
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(40, 40, w - 80, h - 80);

  // Diagonal slash panel 1
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(w - 40, 120);
  ctx.lineTo(w - 40, 480);
  ctx.lineTo(40, 360);
  ctx.closePath();
  ctx.fillStyle = '#E5E7EB';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  // Overlapping character silhouette
  ctx.beginPath();
  ctx.arc(w / 2, 540, 180, 0, Math.PI * 2);
  ctx.fillStyle = '#4B5563';
  ctx.fill();
  ctx.stroke();

  // Diagonal slash panel 2
  ctx.beginPath();
  ctx.moveTo(40, 620);
  ctx.lineTo(w - 40, 500);
  ctx.lineTo(w - 40, h - 40);
  ctx.lineTo(40, h - 40);
  ctx.closePath();
  ctx.fillStyle = '#D1D5DB';
  ctx.fill();
  ctx.stroke();

  // Speech bubbles crossing boundaries
  drawSpeechBubble(ctx, w - 210, 80, 140, 60, 'Kita sampai!');
  drawSpeechBubble(ctx, 60, 720, 120, 60, 'Bersiaplah.');

  ctx.restore();

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], '04_pola_rumit_utuh.png', { type: 'image/png' });
}

export async function generateAllSampleCases(): Promise<File[]> {
  const [f1, f2, f3, f4] = await Promise.all([
    createCase1Page(),
    createCase2Page(),
    createCase3Page(),
    createCase4Page(),
  ]);
  return [f1, f2, f3, f4];
}
