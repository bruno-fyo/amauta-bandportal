// Plantilla PROVISORIA del mail "nuevo material cargado". El diseño definitivo
// se define más adelante: todo el contenido del correo vive acá, n8n solo lo envía.

export type AssetNotificationData = {
  title: string
  description: string | null
  categoryLabel: string
  fileType: string
  url: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildAssetNotificationEmail(data: AssetNotificationData) {
  const subject = `Nuevo material en el portal Amauta: ${data.title}`

  const title = escapeHtml(data.title)
  const category = escapeHtml(data.categoryLabel)
  const fileType = escapeHtml(data.fileType)
  const description = data.description ? escapeHtml(data.description) : ''
  const url = escapeHtml(data.url)

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f5f2ee;font-family:Arial,Helvetica,sans-serif;color:#2b211c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7a6a60;">Portal de recursos Amauta</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Se cargó un nuevo material</h1>
          <p style="margin:0 0 4px;font-size:16px;font-weight:bold;">${title}</p>
          <p style="margin:0 0 16px;font-size:13px;color:#7a6a60;">${category} · ${fileType}</p>
          ${description ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;">${description}</p>` : ''}
          <a href="${url}" style="display:inline-block;padding:12px 20px;background:#5a3d2e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:bold;">Ver en el portal</a>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    'Se cargó un nuevo material en el portal de recursos Amauta.',
    '',
    data.title,
    `${data.categoryLabel} · ${data.fileType}`,
    data.description ?? '',
    '',
    `Ver en el portal: ${data.url}`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')

  return { subject, html, text }
}
