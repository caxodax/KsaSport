import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Inicializar el cliente S3 para Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
})

/**
 * Sube un archivo a Cloudflare R2 y retorna la URL pública
 * @param file El archivo proveniente del FormData
 * @param folder La carpeta donde se guardará (ej: 'pagos', 'avatares')
 */
export async function uploadImageToCloudflare(file: File, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar un nombre único para evitar colisiones
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1000)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${folder}/${uniqueId}.${fileExtension}`

    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME!

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)

    // Construir la URL pública
    // Nota: El usuario debe habilitar "Public Access" en el bucket de Cloudflare 
    // y colocar ese subdominio en la variable CLOUDFLARE_PUBLIC_URL
    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`
    
    return publicUrl
  } catch (error) {
    console.error('Error subiendo archivo a Cloudflare R2:', error)
    return null
  }
}
