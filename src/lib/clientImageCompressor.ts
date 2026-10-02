/**
 * Utilidad de compresión de imágenes en el cliente (Browser).
 * 
 * - Reduce imágenes gigantes tomadas desde smartphones (4000x3000px, 8MB-15MB) a un tamaño óptimo
 *   (máx. 1920x1920px, ~200-400KB) usando el elemento Canvas de HTML5.
 * - Calidad visualmente sin pérdidas ("visually lossless", WebP q=0.85):
 *   El texto, números de referencia y firmas bancarias permanecen 100% nítidos y legibles.
 * - Resuelve de raíz el límite estricto de 4.5MB en Vercel Serverless Functions (HTTP 413 Payload Too Large).
 * - Ignora archivos PDF y archivos pequeños (< 350KB), retornándolos intactos.
 */

export async function compressImageClient(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  // 1. Si no es archivo o no es imagen web común, retornar tal cual (ej. PDF)
  if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  // 2. Si ya pesa menos de 350 KB, no es necesario recomprimir
  if (file.size <= 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Si la imagen es más grande que maxDimension, calcular nueva escala manteniendo aspecto
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        // Suavizado bicúbico de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a WebP (estándar moderno de alto rendimiento)
        const outputMime = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Solo sustituir si el resultado realmente redujo el peso
            if (blob.size < file.size) {
              const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
              const compressedFile = new File([blob], newFileName, {
                type: outputMime,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file); // Ante cualquier error de lectura, nunca romper el flujo
      };

      img.src = objectUrl;
    } catch {
      resolve(file);
    }
  });
}
