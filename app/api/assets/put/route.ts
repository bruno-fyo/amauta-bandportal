import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

// Subida del lado del servidor: el navegador envía el archivo como FormData y el
// servidor lo sube a Vercel Blob con put(). Es más confiable en entornos de
// preview que la carga directa cliente→Blob, que puede quedarse colgada detrás
// del proxy. El store de Blob es PRIVADO, por lo que siempre se sube con
// access: 'private' y el contenido se sirve luego por /api/asset-file.
// Usar solo para archivos chicos (imágenes de producto, logos y fichas PDF).
// Los archivos grandes (videos/zips) siguen usando la carga directa.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const pathname = formData.get('pathname')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }
    if (typeof pathname !== 'string' || !pathname) {
      return NextResponse.json({ error: 'Falta el nombre de archivo.' }, { status: 400 })
    }

    const blob = await put(pathname, file, {
      access: 'private',
      addRandomSuffix: true,
    })

    // URL de servicio autenticada (blob.url no es accesible en un store privado).
    const url = `/api/asset-file?pathname=${encodeURIComponent(blob.pathname)}`
    return NextResponse.json({ url, pathname: blob.pathname })
  } catch (error) {
    console.error('[v0] server upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir el archivo.' },
      { status: 500 },
    )
  }
}
