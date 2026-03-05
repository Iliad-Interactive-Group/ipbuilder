'use client';

/**
 * Billboard Compositor — combines a background image, text overlay, and optional logo
 * into a single downloadable PNG at industry-standard billboard dimensions (100 DPI).
 *
 * Uses the browser's native Canvas API — zero additional dependencies.
 */

// ---------------------------------------------------------------------------
// Billboard size presets (100 DPI)
// ---------------------------------------------------------------------------

export interface BillboardSize {
  key: string;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const BILLBOARD_SIZES: BillboardSize[] = [
  { key: 'bulletin',  label: 'Bulletin',      width: 4800, height: 1400, description: 'Highway — 14\' × 48\'' },
  { key: 'poster',    label: 'Poster',         width: 2267, height: 1050, description: 'Street-level — 10\'6\" × 22\'8\"' },
  { key: 'junior',    label: 'Junior Poster',  width: 1200, height: 600,  description: 'Neighborhood — 6\' × 12\'' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Load a data URI or object URL into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}

/** Trigger a file download from a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Compositor
// ---------------------------------------------------------------------------

export interface CompositeBillboardOptions {
  size: BillboardSize;
  backgroundDataUri: string;
  headline: string;
  subheadline: string;
  cta: string;
  logoDataUri?: string;
}

/**
 * Render a composited billboard onto a canvas and return it as a PNG Blob.
 * Optionally draws onto a provided canvas (for the live preview).
 */
export async function compositeBillboard(
  options: CompositeBillboardOptions,
  targetCanvas?: HTMLCanvasElement,
): Promise<Blob> {
  const { size, backgroundDataUri, headline, subheadline, cta, logoDataUri } = options;
  const { width, height } = size;

  // Create or reuse canvas --------------------------------------------------
  const canvas = targetCanvas ?? document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw background — cover-crop to fill canvas -------------------------
  const bgImg = await loadImage(backgroundDataUri);
  drawCoverCrop(ctx, bgImg, width, height);

  // 2. Dark gradient overlay ------------------------------------------------
  //    Covers the lower ~60% of the canvas so text is readable.
  const gradientStart = height * 0.25;
  const gradient = ctx.createLinearGradient(0, gradientStart, 0, height);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');        // transparent
  gradient.addColorStop(0.35, 'rgba(15, 23, 42, 0.70)');  // slate-900 @ 70%
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0.92)');     // slate-900 @ 92%
  ctx.fillStyle = gradient;
  ctx.fillRect(0, gradientStart, width, height - gradientStart);

  // Also lay a subtle top vignette for polish
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.20);
  topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
  topGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.20);

  // 3. Text sizing proportional to canvas width ----------------------------
  const unit = width / 100;            // 1% of canvas width as base unit
  const pad = unit * 4;                // generous horizontal padding
  const textMaxW = width - pad * 2;    // max text width
  const textAreaRight = logoDataUri ? width - pad - (height * 0.12 + unit * 2) : width - pad; // leave room for logo

  // -- Headline --
  const headlineFontSize = Math.round(unit * 4.2);
  ctx.font = `800 ${headlineFontSize}px "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'top';
  const headlineY = height * 0.44;
  const headlineLines = wrapText(ctx, headline, textAreaRight - pad);
  headlineLines.forEach((line, i) => {
    ctx.fillText(line, pad, headlineY + i * (headlineFontSize * 1.15));
  });

  // -- Subheadline --
  const subFontSize = Math.round(unit * 2.2);
  ctx.font = `500 ${subFontSize}px "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = '#CBD5E1';  // slate-300
  const subY = headlineY + headlineLines.length * (headlineFontSize * 1.15) + headlineFontSize * 0.4;
  const subLines = wrapText(ctx, subheadline, textAreaRight - pad);
  subLines.forEach((line, i) => {
    ctx.fillText(line, pad, subY + i * (subFontSize * 1.35));
  });

  // -- CTA pill --
  const ctaFontSize = Math.round(unit * 1.6);
  ctx.font = `700 ${ctaFontSize}px "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
  const ctaMetrics = ctx.measureText(cta.toUpperCase());
  const ctaPadX = ctaFontSize * 1.6;
  const ctaPadY = ctaFontSize * 0.65;
  const ctaW = ctaMetrics.width + ctaPadX * 2;
  const ctaH = ctaFontSize + ctaPadY * 2;
  const ctaX = pad;
  const ctaY = subY + subLines.length * (subFontSize * 1.35) + subFontSize * 0.8;
  const ctaRadius = ctaH * 0.28;

  // Rounded rect
  ctx.fillStyle = '#FBBF24';  // amber-400
  ctx.beginPath();
  ctx.moveTo(ctaX + ctaRadius, ctaY);
  ctx.lineTo(ctaX + ctaW - ctaRadius, ctaY);
  ctx.quadraticCurveTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + ctaRadius);
  ctx.lineTo(ctaX + ctaW, ctaY + ctaH - ctaRadius);
  ctx.quadraticCurveTo(ctaX + ctaW, ctaY + ctaH, ctaX + ctaW - ctaRadius, ctaY + ctaH);
  ctx.lineTo(ctaX + ctaRadius, ctaY + ctaH);
  ctx.quadraticCurveTo(ctaX, ctaY + ctaH, ctaX, ctaY + ctaH - ctaRadius);
  ctx.lineTo(ctaX, ctaY + ctaRadius);
  ctx.quadraticCurveTo(ctaX, ctaY, ctaX + ctaRadius, ctaY);
  ctx.closePath();
  ctx.fill();

  // CTA text
  ctx.fillStyle = '#1E293B'; // slate-800
  ctx.textBaseline = 'middle';
  ctx.fillText(cta.toUpperCase(), ctaX + ctaPadX, ctaY + ctaH / 2);

  // 4. Logo — bottom-right corner -----------------------------------------
  if (logoDataUri) {
    try {
      const logoImg = await loadImage(logoDataUri);
      const maxLogoH = height * 0.14;
      const maxLogoW = width * 0.14;
      const scale = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
      const logoW = logoImg.width * scale;
      const logoH = logoImg.height * scale;
      const logoX = width - pad - logoW;
      const logoY = height - pad * 0.7 - logoH;
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    } catch {
      // Silently skip if logo fails to load
      console.warn('Billboard compositor: logo image failed to load, skipping.');
    }
  }

  // 5. Export as PNG Blob --------------------------------------------------
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null'))),
      'image/png',
    );
  });
}

// ---------------------------------------------------------------------------
// Draw an image cover-cropped into the canvas (center-crop)
// ---------------------------------------------------------------------------

function drawCoverCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
): void {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;

  let sx: number, sy: number, sw: number, sh: number;

  if (imgRatio > canvasRatio) {
    // Image is wider than canvas — crop sides
    sh = img.height;
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Image is taller/squarer — crop top/bottom
    sw = img.width;
    sh = img.width / canvasRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

// ---------------------------------------------------------------------------
// Word-wrap text within a max width
// ---------------------------------------------------------------------------

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}
