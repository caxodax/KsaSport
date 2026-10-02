import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getServiceSupabase } from '@/lib/supabase'
import sharp from 'sharp'

// Tipos MIME y extensiones autorizadas (evita inyecciones de ejecutables o SVG maliciosos)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
  'application/pdf',
])

const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'avif',
  'pdf',
])

// Límite máximo en servidor: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Sube un archivo a Cloudflare R2 y retorna la URL pública.
 * Optimiza automáticamente imágenes a formato WebP moderno con compresión visualmente sin pérdidas,
 * garantizando máxima nitidez de comprobantes y reduciendo drásticamente el consumo de ancho de banda.
 * En caso de que Cloudflare R2 falle o no esté configurado, utiliza Supabase Storage como respaldo.
 * 
 * @param file El archivo proveniente del FormData
 * @param folder La carpeta donde se guardará (ej: 'pagos', 'avatares', 'teams', 'cantina')
 */
export async function uploadImageToCloudflare(file: File, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null

  // 1. Validar límite de peso en servidor
  if (file.size > MAX_FILE_SIZE) {
    console.warn(`[Storage] Archivo rechazado: tamaño excede ${MAX_FILE_SIZE / (1024 * 1024)}MB (${file.size} bytes)`)
    return null
  }

  // 2. Validar extensiones y tipos MIME permitidos
  const rawExtension = (file.name.split('.').pop() || '').toLowerCase()
  const rawMime = (file.type || '').toLowerCase()

  const isAllowedMime = ALLOWED_MIME_TYPES.has(rawMime)
  const isAllowedExt = ALLOWED_EXTENSIONS.has(rawExtension)

  if (!isAllowedMime && !isAllowedExt) {
    console.warn(`[Storage] Tipo de archivo rechazado por seguridad: MIME='${rawMime}', Ext='${rawExtension}'`)
    return null
  }

  const isPdf = rawMime === 'application/pdf' || rawExtension === 'pdf'
  let buffer: Buffer
  let finalExtension = rawExtension || 'jpg'
  let finalContentType = file.type || 'image/jpeg'

  try {
    const bytes = await file.arrayBuffer()
    const rawBuffer = Buffer.from(bytes)

    if (!isPdf) {
      try {
        // Optimización con Sharp (Visually Lossless):
        // - .rotate(): auto-orientar según metadatos EXIF del teléfono (evita comprobantes rotados)
        // - .resize(): limitar a máximo 1920x1920 sin agrandar si es menor (preserva nitidez)
        // - .webp(): compresión WebP al 85% de calidad (ahorro del 80-90% sin pérdida visual)
        buffer = await sharp(rawBuffer)
          .rotate()
          .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85, effort: 4 })
          .toBuffer()

        finalExtension = 'webp'
        finalContentType = 'image/webp'
      } catch (sharpError) {
        console.warn('[Storage] Sharp no pudo procesar la imagen, se usará el archivo original:', sharpError)
        buffer = rawBuffer
      }
    } else {
      buffer = rawBuffer
      finalExtension = 'pdf'
      finalContentType = 'application/pdf'
    }
  } catch (readError) {
    console.error('[Storage] Error leyendo buffer del archivo:', readError)
    return null
  }

  // Identificador único UUID v4 criptográficamente seguro
  const uniqueId = crypto.randomUUID()
  const fileName = `${folder}/${uniqueId}.${finalExtension}`

  // 1. Intentar subir a Cloudflare R2 si las variables de entorno están presentes
  const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  const r2AccessKey = process.env.CLOUDFLARE_ACCESS_KEY_ID
  const r2SecretKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY
  const r2Bucket = process.env.CLOUDFLARE_BUCKET_NAME
  const r2PublicUrl = process.env.CLOUDFLARE_PUBLIC_URL

  if (r2Endpoint && r2AccessKey && r2SecretKey && r2Bucket && r2PublicUrl) {
    try {
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId: r2AccessKey,
          secretAccessKey: r2SecretKey,
        },
      })

      const command = new PutObjectCommand({
        Bucket: r2Bucket,
        Key: fileName,
        Body: buffer,
        ContentType: finalContentType,
      })

      await s3Client.send(command)
      return `${r2PublicUrl}/${fileName}`
    } catch (r2Error) {
      console.warn('Fallo upload a Cloudflare R2, intentando con Supabase Storage:', r2Error)
    }
  }

  // 2. Respaldo / Fallback automático a Supabase Storage
  try {
    const supabase = getServiceSupabase()

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(fileName, buffer, {
        contentType: finalContentType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error subiendo a Supabase Storage:', uploadError)
      return null
    }

    const { data: publicUrlData } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(fileName)

    return publicUrlData.publicUrl
  } catch (supabaseError) {
    console.error('Error general subiendo imagen a almacenamiento:', supabaseError)
    return null
  }
}
