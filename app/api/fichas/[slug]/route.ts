import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { productFichas, FICHA_COUNTRIES, type FichaCountry } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/session'

// Sirve la ficha técnica (PDF) de un producto y país desde un Blob privado.
// Requiere sesión: las fichas son visibles para todo el portal.
// El país se indica con ?country=ar|uy (por defecto 'ar').
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse | Response> {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { slug } = await params
  const countryParam = request.nextUrl.searchParams.get('country') ?? 'ar'
  const country: FichaCountry = (FICHA_COUNTRIES as string[]).includes(countryParam)
    ? (countryParam as FichaCountry)
    : 'ar'

  const [ficha] = await db
    .select()
    .from(productFichas)
    .where(and(eq(productFichas.slug, slug), eq(productFichas.country, country)))
  if (!ficha || !ficha.filePathname) {
    return NextResponse.json({ error: 'La ficha no existe.' }, { status: 404 })
  }

  try {
    const result = await get(ficha.filePathname, { access: 'private' })
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'No se pudo obtener la ficha.' }, { status: 404 })
    }

    const fileName = ficha.fileName ?? `ficha-${slug}-${country}.pdf`
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
