// Mail "nuevo material cargado". Todo el contenido vive acá: el portal arma el
// HTML con los datos del material y n8n solo lo envía por Gmail.
//
// Partes dinámicas (se completan con el material cargado):
//   - Preheader y asunto        → título
//   - Etiqueta de categoría     → categoryLabel
//   - Título de la tarjeta      → title
//   - Descripción               → description (se oculta si está vacía)
//   - Formato                   → fileType
//   - Botón "Ver el nuevo material" → url (link directo al material)
// El resto (header, "¿Cómo usarlo?", footer) es fijo.

export type AssetNotificationData = {
  title: string
  description: string | null
  categoryLabel: string
  fileType: string
  url: string
}

const PORTAL_URL = 'https://recursos.amauta.ag'
const LOGO_WHITE = 'https://fyo.com/fyo/Amauta/elementos/Amauta-Blanco.png'

const FONT_HEADING = `'Geogrotesque','Avenir Next',Avenir,'Arial Narrow',Arial,sans-serif`
const FONT_BODY = `'Titillium Web','Avenir Next',Avenir,Arial,sans-serif`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function howToItem(icon: string, html: string, last = false) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:${last ? 40 : 16}px;">
                <tr>
                  <td valign="top" width="52">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:40px;height:40px;background-color:#623B2A;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:18px;line-height:40px;display:block;">${icon}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;font-weight:400;color:#444444;line-height:1.6;">
                      ${html}
                    </p>
                  </td>
                </tr>
              </table>`
}

export function buildAssetNotificationEmail(data: AssetNotificationData) {
  const subject = `Nuevo material en el Centro de Recursos de Amauta: ${data.title}`

  const title = escapeHtml(data.title)
  const category = escapeHtml(data.categoryLabel)
  const fileType = escapeHtml(data.fileType)
  const description = data.description?.trim() ? escapeHtml(data.description.trim()) : ''
  const url = escapeHtml(data.url || PORTAL_URL)

  const descriptionBlock = description
    ? `<p style="margin:0 0 14px 0;font-family:${FONT_BODY};font-size:14px;font-weight:400;color:#5A5A5A;line-height:1.75;">
                            ${description}
                          </p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Nuevo material disponible en el Centro de Recursos de Amauta</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style type="text/css">
    .avenir-bold { font-family: Avenir, Arial, sans-serif !important; font-weight: 700 !important; }
  </style>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style type="text/css">
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; background-color: #EDE6DE; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .hero-title { font-size: 26px !important; }
      .pad-main { padding: 32px 20px !important; }
      .pad-hero { padding: 28px 20px 36px 20px !important; }
      .stack { display: block !important; width: 100% !important; }
      .stack-img { padding: 0 0 18px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#EDE6DE;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Sumamos nuevo material al Centro de Recursos: ${title}. Ya está disponible para descargar.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#EDE6DE;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;">

          <tr>
            <td style="background-color:#623B2A;padding:22px 36px 20px 36px;border-radius:6px 6px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <img src="${LOGO_WHITE}" alt="Amauta" width="140" style="display:block;width:140px;max-width:160px;height:auto;border:0;outline:none;text-decoration:none;">
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;background-color:#CEDC00;color:#623B2A;font-family:${FONT_HEADING};font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:5px 12px;border-radius:2px;">
                      NUEVO MATERIAL
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad-hero" style="background-color:#623B2A;padding:36px 36px 44px 36px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td style="width:40px;height:3px;background-color:#CEDC00;"></td>
                  <td style="width:10px;height:3px;background-color:rgba(206,220,0,0.3);"></td>
                  <td style="width:6px;height:3px;background-color:rgba(206,220,0,0.1);"></td>
                </tr>
              </table>
              <h1 class="hero-title avenir-bold" style="margin:0 0 16px 0;font-family:${FONT_HEADING};font-size:34px;font-weight:700;line-height:1.15;color:#ffffff;letter-spacing:-0.3px;">
                Novedades en el Centro de recursos
              </h1>
              <p style="margin:0;font-family:${FONT_BODY};font-size:16px;font-weight:300;color:rgba(255,255,255,0.80);line-height:1.65;">
                Ya está disponible un nuevo material para que lo descargues y lo uses.
              </p>
            </td>
          </tr>

          <tr>
            <td style="height:5px;background-color:#CEDC00;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td class="pad-main" style="background-color:#ffffff;padding:44px 36px 36px 36px;">

              <p class="avenir-bold" style="margin:0 0 14px 0;font-family:${FONT_HEADING};font-size:12px;font-weight:700;color:#8C6A58;text-transform:uppercase;letter-spacing:2px;">
                Lo nuevo
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:36px;background-color:#FBF7F4;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(98,59,42,0.08);">
                <tr>
                  <td style="width:5px;background-color:#CEDC00;"></td>
                  <td style="padding:24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="stack" valign="middle">
                          <span style="display:inline-block;background-color:#623B2A;color:#CEDC00;font-family:${FONT_HEADING};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:2px;margin-bottom:12px;">
                            ${category}
                          </span>
                          <h2 class="avenir-bold" style="margin:0 0 8px 0;font-family:${FONT_HEADING};font-size:20px;font-weight:700;color:#623B2A;line-height:1.25;">
                            ${title}
                          </h2>
                          ${descriptionBlock}
                          <p style="margin:0;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:#623B2A;line-height:1.5;">
                            &#128206; Formato: ${fileType}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h2 class="avenir-bold" style="margin:0 0 22px 0;font-family:${FONT_HEADING};font-size:20px;font-weight:700;color:#623B2A;text-transform:uppercase;letter-spacing:1px;">
                ¿Cómo usarlo?
              </h2>

              ${howToItem('&#11015;&#65039;', '<b>Ingresá con tu usuario</b> al Centro de Recursos y descargalo desde su sección.')}
              ${howToItem('&#129309;', '<b>Usalo tal cual</b>: respeta la identidad de Amauta y está listo para publicar.', true)}

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-radius:6px;box-shadow:0 6px 20px rgba(206,220,0,0.45);">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="10%" stroke="f" fillcolor="#CEDC00">
                            <w:anchorlock/>
                            <center style="color:#623B2A;font-family:'Arial Narrow',Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:1.5px;">VER EL NUEVO MATERIAL</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a class="avenir-bold" href="${url}" target="_blank" style="display:inline-block;background-color:#CEDC00;color:#623B2A;font-family:${FONT_HEADING};font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:6px;">
                            Ver el nuevo material &rarr;
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:8px;">
                <tr>
                  <td style="height:1px;background-color:#EDE6DE;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;text-align:center;font-family:${FONT_BODY};font-size:14px;font-weight:400;color:#7A6A60;line-height:1.6;">
                ¿Todavía no tenés usuario? <a href="${PORTAL_URL}" target="_blank" style="color:#623B2A;font-weight:700;text-decoration:underline;">Solicitá tu acceso acá</a>.
              </p>

            </td>
          </tr>

          <tr>
            <td style="background-color:#3D2316;padding:28px 36px;border-radius:0 0 6px 6px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 20px auto;">
                <tr>
                  <td style="width:32px;height:2px;background-color:#CEDC00;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <a href="https://www.amauta.ag"><img src="${LOGO_WHITE}" alt="Amauta" width="160" style="display:block;width:160px;max-width:100%;height:auto;margin:0 auto 20px auto;border:0;outline:none;text-decoration:none;"></a>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://www.facebook.com/AmautaAgro/" target="_blank" aria-label="Facebook de Amauta" style="display:block;text-decoration:none;">
                      <img src="https://fyo.com/fyo/Amauta/elementos/redes/Iconos%20Redes-01.png" alt="Facebook" width="30" height="30" style="display:block;width:30px;height:30px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://www.instagram.com/amautaagro/" target="_blank" aria-label="Instagram de Amauta" style="display:block;text-decoration:none;">
                      <img src="https://fyo.com/fyo/Amauta/elementos/redes/Iconos%20Redes-02.png" alt="Instagram" width="30" height="30" style="display:block;width:30px;height:30px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://www.linkedin.com/company/amautaagro/" target="_blank" aria-label="LinkedIn de Amauta" style="display:block;text-decoration:none;">
                      <img src="https://fyo.com/fyo/Amauta/elementos/redes/Iconos%20Redes-03.png" alt="LinkedIn" width="30" height="30" style="display:block;width:30px;height:30px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    'Novedades en el Centro de Recursos de Amauta: ya está disponible un nuevo material para que lo descargues y lo uses.',
    '',
    `${data.categoryLabel.toUpperCase()}`,
    data.title,
    data.description?.trim() ?? '',
    `Formato: ${data.fileType}`,
    '',
    `Ver el nuevo material: ${data.url || PORTAL_URL}`,
    '',
    `¿Todavía no tenés usuario? Solicitá tu acceso en ${PORTAL_URL}`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')

  return { subject, html, text }
}
