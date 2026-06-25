import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

// Genera el token de subida para carga directa del navegador a Vercel Blob.
// La inserción del registro en la base de datos la hace la server action
// `saveAssetRecord` una vez que la subida termina (el callback onUploadCompleted
// no se dispara en entornos locales/preview sin URL pública).
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Solo los administradores pueden subir assets.
        const user = await getCurrentUser()
        if (!user || user.role !== 'admin') {
          throw new Error('No autorizado.')
        }
        return {
          allowedContentTypes: [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/svg+xml',
            'image/webp',
            'application/zip',
            'application/x-zip-compressed',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint',
            'video/mp4',
            'video/quicktime',
            'video/webm',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 1024 * 1024 * 1024, // 1 GB
        }
      },
      onUploadCompleted: async () => {
        // No-op: el registro se guarda desde el cliente vía saveAssetRecord.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('[v0] handleUpload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el token.' },
      { status: 400 },
    )
  }
}
