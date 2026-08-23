/**
 * Client-side image compression utility for Hakimi Supermarket.
 * Resizes long dimensions to max 800px and compresses to WebP/JPEG format.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  format: string;
}

export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas 2d context.'));
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP export first, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        let format = 'webp';

        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          format = 'jpeg';
        }

        // Estimate size from Base64 string length
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const compressedSizeKb = Math.round((base64Length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          originalSizeKb,
          compressedSizeKb,
          format
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compacts any image string or file to a lightweight data URL string.
 */
export async function compactImage(fileOrStr: File | string): Promise<string> {
  if (typeof fileOrStr === 'string') {
    // If it's an emoji or external URL or already small data URL, return as is
    if (!fileOrStr.startsWith('data:image/') || fileOrStr.length < 50000) {
      return fileOrStr;
    }
  }

  if (fileOrStr instanceof File) {
    const res = await compressImageFile(fileOrStr);
    return res.dataUrl;
  }

  return fileOrStr;
}
