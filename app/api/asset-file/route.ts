import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { getCurrentUser } from '@/lib/session'

// Sirve un archivo (imagen de producto, logo o imagen de galería) desde un Blob
// privado. El store de Blob es privado, por lo que blob.url no es accesible
// directamente: hay que transmitir el contenido con get(). Requiere sesión, ya
// que todo el portal está detrás de login. El archivo se indica con ?pathname=.
// Con ?download=1 se fuerza la descarga; por defecto se muestra en línea.
export async function GET(request: NextRequest): Promise<NextResponse | Response> {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname) {
    return NextResponse.json({ error: 'Falta el archivo.' }, { status: 400 })
  }

  try {
    const result = await get(pathname, {
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })

    if (!result) {
      return NextResponse.json({ error: 'El archivo no existe.' }, { status: 404 })
    }

    if (result.statusCode === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          'Cache-Control': 'private, no-cache',
        },
      })
    }

    const fileName = pathname.split('/').pop() || 'archivo'
    const forceDownload = request.nextUrl.searchParams.get('download') === '1'
    const disposition = forceDownload ? 'attachment' : 'inline'

    const headers = new Headers()
    headers.set('Content-Type', result.blob.contentType || 'application/octet-stream')
    headers.set('ETag', result.blob.etag)
    headers.set('Cache-Control', 'private, no-cache')
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(fileName)}"`,
    )
    if (result.blob.size) headers.set('Content-Length', String(result.blob.size))

    return new Response(result.stream, { status: 200, headers })
  } catch (err) {
    console.error('[v0] asset-file stream error:', err)
    return NextResponse.json({ error: 'No se pudo obtener el archivo.' }, { status: 500 })
  }
}
