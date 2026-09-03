import { upload } from '@vercel/blob/client'

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

  // Archivo grande (> 4 MB): carga directa cliente→Blob. Es la única vía posible
  // en Vercel (los route handlers no aceptan bodies grandes y el multipart de
  // Blob exige partes ≥ 5 MB). Se usa un PUT único (no multipart): el handshake
  // multipart, con sus requests de partes en paralelo, es la causa habitual de
  // que la subida quede "colgada" detrás de un proxy corporativo.
  //
  // Watchdog: si no hay progreso durante STALL_MS, se aborta con un error claro
  // en vez de dejar el botón en "Subiendo…" para siempre.
  const STALL_MS = 90_000
  const controller = new AbortController()
  let lastActivity = Date.now()
  let lastPct = -1
  const watchdog = setInterval(() => {
    if (Date.now() - lastActivity > STALL_MS) {
      controller.abort()
      clearInterval(watchdog)
    }
  }, 5_000)

  try {
    const blob = await upload(pathname, file, {
      access: 'private',
      handleUploadUrl: '/api/assets/upload',
      abortSignal: controller.signal,
      onUploadProgress: (e) => {
        const pct = Math.round(e.percentage)
        if (pct !== lastPct) {
          lastPct = pct
          lastActivity = Date.now()
        }
        onProgress?.(pct)
      },
    })
    return { fileName: file.name, filePathname: blob.pathname, fileUrl: blob.url, fileSize: file.size }
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        'La subida se detuvo sin avanzar. Puede que tu red bloquee la subida directa de archivos grandes; probá desde otra red o comprimí el archivo.',
      )
    }
    throw err
  } finally {
    clearInterval(watchdog)
  }
}
