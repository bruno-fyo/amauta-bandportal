import { put, get, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const maxDuration = 300

// Techo defensivo para no agotar la memoria de la función al ensamblar.
const MAX_TOTAL_BYTES = 300 * 1024 * 1024 // 300 MB

function safeId(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : null
}

// Ensambla las partes subidas por /api/assets/chunk en el blob final privado.
// Descarga cada parte server-side (server→Blob funciona aunque el navegador no
// pueda), las concatena, sube el archivo final y borra los temporales.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let body: {
    uploadId?: string
    totalChunks?: number
    category?: string
    fileName?: string
    contentType?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const uploadId = safeId(body.uploadId)
  const total = Number(body.totalChunks)
  const category = typeof body.category === 'string' ? body.category : ''
  const fileName = typeof body.fileName === 'string' ? body.fileName : ''
  const contentType =
    typeof body.contentType === 'string' && body.contentType
      ? body.contentType
      : 'application/octet-stream'

  if (!uploadId) {
    return NextResponse.json({ error: 'uploadId inválido.' }, { status: 400 })
  }
  if (!Number.isInteger(total) || total < 1 || total > 9999) {
    return NextResponse.json({ error: 'Cantidad de partes inválida.' }, { status: 400 })
  }
  if (!category || !fileName) {
    return NextResponse.json({ error: 'Faltan datos del archivo.' }, { status: 400 })
  }

  const tmpPaths: string[] = []
  try {
    // Descargar y concatenar las partes en orden.
    const parts: Buffer[] = []
    let totalBytes = 0

    for (let i = 0; i < total; i++) {
      const padded = String(i).padStart(5, '0')
      const tmpPath = `tmp-uploads/${uploadId}/${padded}`
      tmpPaths.push(tmpPath)

      const result = await get(tmpPath, { access: 'private' })
      if (!result || result.statusCode !== 200) {
        return NextResponse.json(
          { error: `Falta la parte ${i + 1} de ${total}. Reintentá la subida.` },
          { status: 400 },
        )
      }

      const buf = Buffer.from(await new Response(result.stream).arrayBuffer())
      totalBytes += buf.byteLength
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json({ error: 'El archivo es demasiado grande.' }, { status: 413 })
      }
      parts.push(buf)
    }

    const fileBuffer = Buffer.concat(parts)

    const blob = await put(`assets/${category}/${fileName}`, fileBuffer, {
      access: 'private',
      addRandomSuffix: true,
      contentType,
    })

    // Borrar las partes temporales (best-effort).
    try {
      await Promise.all(tmpPaths.map((p) => del(p)))
    } catch (e) {
      console.error('[v0] cleanup temp chunks error:', e)
    }

    const url = `/api/asset-file?pathname=${encodeURIComponent(blob.pathname)}`
    return NextResponse.json({ url, pathname: blob.pathname, size: fileBuffer.byteLength })
  } catch (error) {
    console.error('[v0] chunk complete error:', error)
    // Intento de limpieza aunque haya fallado el ensamblado.
    try {
      await Promise.all(tmpPaths.map((p) => del(p)))
    } catch {
      // ignorar
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al ensamblar el archivo.' },
      { status: 500 },
    )
  }
}
