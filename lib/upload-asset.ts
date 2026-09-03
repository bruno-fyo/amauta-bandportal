// Sube un archivo a Vercel Blob a través de la ruta del servidor
// `/api/assets/put`. Es más confiable en preview que la carga directa
// cliente→Blob. El store es privado, así que devuelve la `url` de la ruta de
// servicio autenticada (`/api/asset-file?pathname=...`) —lista para usar en
// <img> o enlaces de descarga— y el `pathname` real del blob (para borrarlo).
export async function uploadAsset(
  pathname: string,
  file: File,
): Promise<{ url: string; pathname: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('pathname', pathname)

  const res = await fetch('/api/assets/put', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'No se pudo subir el archivo.')
  }

  return (await res.json()) as { url: string; pathname: string }
}

// Límite de body de un route handler en Vercel (~4.5 MB). Por debajo de este
// umbral subimos server-side (confiable); por encima, carga directa multipart.
const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024 // 4 MB

export type UploadedAssetInfo = {
  fileName: string
  filePathname: string
  fileUrl: string
  fileSize: number
}

// Sube un asset eligiendo la vía más confiable según el tamaño:
// - Archivos chicos (≤ 4 MB: PDF, Office, imágenes): ruta server-side
//   `/api/assets/put`, que evita el cuelgue de la carga directa tras el proxy.
// - Archivos grandes (videos, ZIP pesados): carga directa multipart
//   cliente→Blob, que soporta archivos de hasta 1 GB.
// `filePathname` es siempre el pathname real del blob (lo usa la descarga y el
// borrado); `fileUrl` es informativo.
export async function uploadAssetFile(
  category: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadedAssetInfo> {
  const pathname = `assets/${category}/${file.name}`

  if (file.size <= SERVER_UPLOAD_MAX_BYTES) {
    onProgress?.(40)
    const { url, pathname: stored } = await uploadAsset(pathname, file)
    onProgress?.(100)
    return { fileName: file.name, filePathname: stored, fileUrl: url, fileSize: file.size }
  }

  // Archivo grande (> 4 MB): subida por partes a NUESTRO dominio. La carga
  // directa cliente→Blob no sirve acá porque la red corporativa bloquea el
  // dominio de Blob (`*.blob.vercel-storage.com`). En su lugar, partimos el
  // archivo en trozos de 4 MB (cada request queda bajo el límite de ~4.5 MB del
  // route handler) y el servidor los reensambla en el blob final.
  const CHUNK_SIZE = 4 * 1024 * 1024 // 4 MB
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const uploadId = crypto.randomUUID().replace(/-/g, '')

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size))

    const fd = new FormData()
    fd.append('chunk', chunk, `${uploadId}-${i}`)
    fd.append('uploadId', uploadId)
    fd.append('index', String(i))

    const res = await fetch('/api/assets/chunk', { method: 'POST', body: fd })
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      throw new Error(data?.error ?? `No se pudo subir la parte ${i + 1} de ${totalChunks}.`)
    }

    // Reservamos el último 5% para el ensamblado en el servidor.
    onProgress?.(Math.round(((i + 1) / totalChunks) * 95))
  }

  // Ensamblado final en el servidor.
  const completeRes = await fetch('/api/assets/chunk/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      totalChunks,
      category,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    }),
  })
  if (!completeRes.ok) {
    const data = (await completeRes.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'No se pudo ensamblar el archivo en el servidor.')
  }

  const { url, pathname: stored } = (await completeRes.json()) as {
    url: string
    pathname: string
  }
  onProgress?.(100)
  return { fileName: file.name, filePathname: stored, fileUrl: url, fileSize: file.size }
}
