import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getServiceSupabase } from '@/lib/supabase'

/**
 * Sube un archivo a Cloudflare R2 y retorna la URL pública.
 * En caso de que Cloudflare R2 falle o no esté configurado en el entorno (ej. Vercel),
 * utiliza automáticamente el almacenamiento de Supabase Storage como respaldo.
 * 
 * @param file El archivo proveniente del FormData
 * @param folder La carpeta donde se guardará (ej: 'pagos', 'avatares')
 */
export async function uploadImageToCloudflare(file: File, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1000)
  const fileExtension = file.name.split('.').pop() || 'jpg'
  const fileName = `${folder}/${uniqueId}.${fileExtension}`

  // 1. Intentar subir a Cloudflare R2 si las variables de entorno están presentes
  const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  const r2AccessKey = process.env.CLOUDFLARE_ACCESS_KEY_ID
  const r2SecretKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY
  const r2Bucket = process.env.CLOUDFLARE_BUCKET_NAME
  const r2PublicUrl = process.env.CLOUDFLARE_PUBLIC_URL

  if (r2Endpoint && r2AccessKey && r2SecretKey && r2Bucket && r2PublicUrl) {
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

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
        ContentType: file.type || 'image/jpeg',
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
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
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
