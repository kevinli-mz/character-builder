/**
 * Compute whether to use light (white) or dark text over an image region
 * based on average luminance. Dark background → light text; light background → dark text.
 */
function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** From ImageData (bottom-half region), return 'light' (white) or 'dark' (dark gray). */
export function getTextColorFromImageData(imageData: ImageData): 'light' | 'dark' {
  const { data, width, height } = imageData;
  let sum = 0;
  let count = 0;
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
      const i = (y * width + x) * 4;
      sum += luminance(data[i], data[i + 1], data[i + 2]);
      count++;
    }
  }
  const avg = count ? sum / count : 0.5;
  return avg < 0.5 ? 'light' : 'dark';
}

/** Load image from URL, sample bottom half, return preferred text color. */
export function getTextColorFromImageUrl(url: string): Promise<'light' | 'dark'> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('dark');
        return;
      }
      ctx.drawImage(img, 0, 0);
      const halfH = Math.floor(h * 0.5);
      const data = ctx.getImageData(0, halfH, w, h - halfH);
      resolve(getTextColorFromImageData(data));
    };
    img.onerror = () => resolve('dark');
    img.src = url;
  });
}

export const CARD_TEXT_COLORS = {
  light: { title: '#ffffff', body: 'rgba(255,255,255,0.9)' },
  dark: { title: '#1c1917', body: '#44403c' },
} as const;
