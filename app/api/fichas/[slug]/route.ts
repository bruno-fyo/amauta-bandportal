import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { productFichas } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/session'

// Sirve la ficha técnica (PDF) de un producto desde un Blob privado.
// Requiere sesión: las fichas son visibles para todo el portal.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse | Response> {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { slug } = await params

  const [ficha] = await db
    .select()
    .from(productFichas)
    .where(eq(productFichas.slug, slug))
  if (!ficha || !ficha.filePathname) {
    return NextResponse.json({ error: 'La ficha no existe.' }, { status: 404 })
  }

  try {
    const result = await get(ficha.filePathname, { access: 'private' })
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'No se pudo obtener la ficha.' }, { status: 404 })
    }

    const fileName = ficha.fileName ?? `ficha-${slug}.pdf`
    // Por defecto se abre en línea (previsualización); con ?download=1 se descarga.
    const forceDownload = request.nextUrl.searchParams.get('download') === '1'
    const disposition = forceDownload ? 'attachment' : 'inline'
    const headers = new Headers()
    headers.set('Content-Type', result.blob.contentType || 'application/pdf')
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(fileName)}"`,
    )
    if (result.blob.size) headers.set('Content-Length', String(result.blob.size))

    return new Response(result.stream, { status: 200, headers })
  } catch (err) {
    console.error('[v0] ficha download error:', err)
    return NextResponse.json({ error: 'No se pudo descargar la ficha.' }, { status: 500 })
  }
}
