import QRCode from 'qrcode';
import { OfficialModel, Plaque } from '../types';

export interface RenderPlaqueOptions {
  model: OfficialModel;
  plaque: Plaque;
  baseUrl?: string;
  canvasWidth?: number; // default 1200
  canvasHeight?: number; // default 1200
}

/**
 * Loads an image safely with crossOrigin anonymous and fallback
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image from ${src}: ${e}`));
    img.src = src;
  });
}

/**
 * Draws a stylized high-fidelity plaque background fallback if network image is blocked by CORS
 */
function drawFallbackBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  model: OfficialModel
) {
  // Rich dark metallic radial gradient
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    50,
    width / 2,
    height / 2,
    width * 0.75
  );
  grad.addColorStop(0, '#16161d');
  grad.addColorStop(0.7, '#0c0c0f');
  grad.addColorStop(1, '#050507');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Border highlight
  ctx.strokeStyle = '#282834';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Red accent border corner lines
  ctx.strokeStyle = '#e50914';
  ctx.lineWidth = 12;
  const cornerLen = 120;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(16, 16 + cornerLen);
  ctx.lineTo(16, 16);
  ctx.lineTo(16 + cornerLen, 16);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - 16, height - 16 - cornerLen);
  ctx.lineTo(width - 16, height - 16);
  ctx.lineTo(width - 16 - cornerLen, height - 16);
  ctx.stroke();

  // Top NFC / Dinâmico Pro Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DINÂMICO PRO', width / 2, 130);

  // NFC wave symbol
  ctx.strokeStyle = '#e50914';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(width / 2, 210, 30, Math.PI * 0.8, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width / 2, 210, 48, Math.PI * 0.8, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width / 2, 210, 66, Math.PI * 0.8, Math.PI * 1.8);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('APROXIME O CELULAR (NFC)', width / 2, 330);
  ctx.fillStyle = '#64748b';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OU APONTE A CÂMERA PARA O QR CODE', width / 2, 365);
}

/**
 * Renders a full high-resolution (1200x1200px - 300DPI 10x10cm) plaque onto an HTMLCanvasElement
 */
export async function renderPlaqueToCanvas(
  options: RenderPlaqueOptions
): Promise<HTMLCanvasElement> {
  const { model, plaque, baseUrl, canvasWidth = 1200, canvasHeight = 1200 } = options;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // 1. Draw base model template
  try {
    const bgImg = await loadImage(model.imageUrl);
    ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
  } catch (err) {
    console.warn(`Falling back to vector background for model ${model.id}:`, err);
    drawFallbackBackground(ctx, canvasWidth, canvasHeight, model);
  }

  // 2. Clean/Cover the old illustrative QR code placeholder seamlessly
  const qrZoneX = (model.qrZone.x / 100) * canvasWidth;
  const qrZoneY = (model.qrZone.y / 100) * canvasHeight;
  const qrZoneSize = (model.qrZone.size / 100) * canvasWidth;
  const pad = ((model.qrZone.coverPadding || 1.5) / 100) * canvasWidth;

  // Draw clean cover patch matching model template background
  ctx.fillStyle = model.qrZone.coverColor || '#0a0a0c';
  ctx.fillRect(
    qrZoneX - pad,
    qrZoneY - pad,
    qrZoneSize + pad * 2,
    qrZoneSize + pad * 2
  );

  // 3. Generate the dynamic QR Code image
  const resolvedBaseUrl =
    baseUrl ||
    import.meta.env.VITE_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const redirectUrl = `${resolvedBaseUrl}/r/${plaque.publicId}`;

  // Generate crisp QR code data URL with white background and black cells for maximum optical readability
  const qrDataUrl = await QRCode.toDataURL(redirectUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: Math.round(qrZoneSize),
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const qrImg = await loadImage(qrDataUrl);

  // Draw subtle white border card around QR code for crisp contrast
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrZoneX - 4, qrZoneY - 4, qrZoneSize + 8, qrZoneSize + 8);
  ctx.drawImage(qrImg, qrZoneX, qrZoneY, qrZoneSize, qrZoneSize);

  // 4. Draw Sequential Number
  const numX = (model.numberZone.x / 100) * canvasWidth;
  const numY = (model.numberZone.y / 100) * canvasHeight;
  const fontSize = model.numberZone.fontSize || 28;

  ctx.save();
  ctx.textAlign = model.numberZone.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;

  // Draw soft dark shadow behind text for legibility over any gradient
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = model.numberZone.color || '#e50914';
  const displayNum = `${model.numberZone.prefix || 'Nº '}${plaque.numberFormatted}`;
  ctx.fillText(displayNum, numX, numY);
  ctx.restore();

  return canvas;
}

/**
 * Returns a high-res Blob (image/png) for a plaque
 */
export async function getPlaqueBlob(options: RenderPlaqueOptions): Promise<Blob> {
  const canvas = await renderPlaqueToCanvas(options);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob'));
    }, 'image/png', 1.0);
  });
}

/**
 * Returns a high-res DataURL (image/png) for a plaque
 */
export async function getPlaqueDataUrl(options: RenderPlaqueOptions): Promise<string> {
  const canvas = await renderPlaqueToCanvas(options);
  return canvas.toDataURL('image/png', 1.0);
}
