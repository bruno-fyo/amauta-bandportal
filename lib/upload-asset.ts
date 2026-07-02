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
