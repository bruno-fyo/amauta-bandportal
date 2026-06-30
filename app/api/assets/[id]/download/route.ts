import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/session'

// Sirve un material almacenado en un Blob privado.
// Verifica sesión y visibilidad por rol antes de transmitir el archivo.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse | Response> {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await params
  const assetId = Number(id)
  if (!Number.isInteger(assetId)) {
    return NextResponse.json({ error: 'Material inválido.' }, { status: 400 })
  }

  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId))
  if (!asset || !asset.filePathname) {
    return NextResponse.json({ error: 'El material no existe.' }, { status: 404 })
  }

  // Los admin ven todo; el resto solo si su rol está en la visibilidad.
  const allowed = user.role === 'admin' || asset.visibility.includes(user.role)
  if (!allowed) {
    return NextResponse.json({ error: 'No tenés acceso a este material.' }, { status: 403 })
  }

  try {
    const result = await get(asset.filePathname, { access: 'private' })
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'No se pudo obtener el archivo.' }, { status: 404 })
    }

    const fileName = asset.fileName ?? `${asset.title}`
    // Por defecto se muestra en línea (útil para previsualizar imágenes);
    // con ?download=1 se fuerza la descarga del archivo.
    const forceDownload = request.nextUrl.searchParams.get('download') === '1'
    const disposition = forceDownload ? 'attachment' : 'inline'
    const headers = new Headers()
    headers.set('Content-Type', result.blob.contentType || 'application/octet-stream')
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(fileName)}"`,
    )
    if (result.blob.size) headers.set('Content-Length', String(result.blob.size))

    return new Response(result.stream, { status: 200, headers })
  } catch (err) {
    console.error('[v0] asset download error:', err)
    return NextResponse.json({ error: 'No se pudo descargar el material.' }, { status: 500 })
  }
}
