/**
 * Utilidad de compresión y optimización de imágenes en el cliente (Browser).
 * 
 * - Reduce imágenes de alta resolución tomadas desde smartphones (iPhone HEIC/JPEG, Android)
 *   a un tamaño óptimo (máx. 1920x1920px, ~150-350KB).
 * - Soporte universal para iOS Safari y navegadores móviles:
 *   - Si el navegador soporta WebP en Canvas, comprime a WebP.
 *   - Si Safari no soporta exportación WebP en Canvas (o genera PNG pesado por fallback),
 *     genera JPEG con calidad 0.82 garantizando compatibilidad y ligereza absoluta.
 *   - Admite decodificación mediante createImageBitmap (rápido en iOS 17+) o new Image().
 * - Evita de raíz el límite estricto de 4.5MB en Vercel Serverless Functions (HTTP 413 Payload Too Large).
 */

export async function compressImageClient(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  if (!file) return file;

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isImageMime = file.type ? file.type.startsWith('image/') : false;
  const isImageExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'avif', 'bmp'].includes(ext);

  // Si no es imagen (ej: PDF), retornar tal cual
  if (!isImageMime && !isImageExt) {
    return file;
  }
  if (file.type === 'image/svg+xml' || ext === 'svg') {
    return file;
  }

  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || ext === 'heic' || ext === 'heif';

  // Si ya es liviano (<300KB) y no es HEIC, no es necesario procesar
  if (file.size <= 300 * 1024 && !isHeic) {
    return file;
  }

  return new Promise(async (resolve) => {
    let resolved = false;
    const safeResolve = (result: File) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    // Timeout de seguridad en caso de bloqueo inesperado
    const timer = setTimeout(() => {
      safeResolve(file);
    }, 6000);

    try {
      let width = 0;
      let height = 0;
      let drawSource: CanvasImageSource | null = null;
      let cleanup: (() => void) | null = null;

      // 1. Intentar createImageBitmap (muy eficiente en móviles modernos y Safari 17+)
      if (typeof createImageBitmap === 'function') {
        try {
          const bitmap = await createImageBitmap(file);
          width = bitmap.width;
          height = bitmap.height;
          drawSource = bitmap;
          cleanup = () => {
            try {
              bitmap.close();
            } catch {}
          };
        } catch {
          // Si falla (ej. HEIC no soportado por bitmap), continúa al paso 2
        }
      }

      // 2. Si createImageBitmap no funcionó, cargar con HTMLImageElement
      if (!drawSource) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        await new Promise<void>((imgResolve, imgReject) => {
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            width = img.naturalWidth || img.width;
            height = img.naturalHeight || img.height;
            drawSource = img;
            imgResolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            imgReject(new Error('Fallo al cargar imagen'));
          };
          img.src = objectUrl;
        });
      }

      if (!drawSource || width === 0 || height === 0) {
        clearTimeout(timer);
        cleanup?.();
        safeResolve(file);
        return;
      }

      // 3. Redimensionar manteniendo proporción si excede maxDimension
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
        clearTimeout(timer);
        cleanup?.();
        safeResolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(drawSource, 0, 0, width, height);
      cleanup?.();

      // 4. Exportar a Blob con fallback universal
      const toBlobPromise = (mime: string, q: number): Promise<Blob | null> => {
        return new Promise((res) => {
          try {
            canvas.toBlob((b) => res(b), mime, q);
          } catch {
            res(null);
          }
        });
      };

      // Intentar WebP primero
      let blob = await toBlobPromise('image/webp', quality);
      let outputMime = 'image/webp';
      let outputExt = 'webp';

      // Si el navegador no produjo WebP (o Safari devolvió image/png pesado), usamos JPEG universal
      if (!blob || blob.type !== 'image/webp') {
        blob = await toBlobPromise('image/jpeg', 0.82);
        outputMime = 'image/jpeg';
        outputExt = 'jpg';
      }

      clearTimeout(timer);

      if (blob && (blob.size < file.size || isHeic)) {
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const optimizedFile = new File([blob], `${baseName}.${outputExt}`, {
          type: outputMime,
          lastModified: Date.now(),
        });
        safeResolve(optimizedFile);
      } else {
        safeResolve(file);
      }
    } catch {
      clearTimeout(timer);
      safeResolve(file);
    }
  });
}
