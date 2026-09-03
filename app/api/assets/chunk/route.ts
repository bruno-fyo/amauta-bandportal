import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const maxDuration = 60

// Recibe UNA parte de un archivo grande y la guarda como blob temporal privado.
// El navegante parte el archivo en trozos de ~4 MB y los envía por acá, a
// NUESTRO dominio, evitando la subida directa cliente→Blob (que algunas redes
// corporativas bloquean). El ensamblado final lo hace /api/assets/chunk/complete.
const MAX_CHUNK_BYTES = 4.4 * 1024 * 1024 // margen bajo el límite de ~4.5 MB

function safeId(v: unknown): string | null {
  if (typeof v !== 'string') return null
  // Solo permitimos caracteres seguros para armar el pathname (sin traversal).
  return /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const formData = await request.formData()
    const chunk = formData.get('chunk')
    const uploadId = safeId(formData.get('uploadId'))
    const indexRaw = formData.get('index')

    if (!(chunk instanceof File)) {
      return NextResponse.json({ error: 'No se recibió la parte.' }, { status: 400 })
    }
    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId inválido.' }, { status: 400 })
    }
    const index = Number(indexRaw)
    if (!Number.isInteger(index) || index < 0 || index > 9999) {
      return NextResponse.json({ error: 'Índice de parte inválido.' }, { status: 400 })
    }
    if (chunk.size > MAX_CHUNK_BYTES) {
      return NextResponse.json({ error: 'La parte es demasiado grande.' }, { status: 413 })
    }

    // Índice con padding para que el orden lexicográfico == orden numérico.
    const padded = String(index).padStart(5, '0')
    await put(`tmp-uploads/${uploadId}/${padded}`, chunk, {
      access: 'private',
      addRandomSuffix: false,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] chunk upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir la parte.' },
      { status: 500 },
    )
  }
}
