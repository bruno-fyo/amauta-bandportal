// Script de un solo uso: reduce las miniaturas de productos.
// Los PNG originales en public/products son de 4000x4000 (~3.5 MB c/u) pero se
// muestran como miniaturas de ~250px. Los reducimos a 1000px máx y recomprimimos.
// La alta resolución sigue disponible en el descargable (product.images), así
// que esto no afecta la calidad de lo que el usuario baja.
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const DIR = 'public/products'
const MAX = 1000

const files = (await readdir(DIR)).filter((f) => /\.png$/i.test(f))
let before = 0
let after = 0

for (const file of files) {
  const path = join(DIR, file)
  const sizeBefore = (await stat(path)).size
  before += sizeBefore

  // Redimensiona (sin agrandar) y recomprime conservando el canal alpha.
  const buf = await sharp(path)
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80, effort: 8 })
    .toBuffer()

  await sharp(buf).toFile(path)
  const sizeAfter = (await stat(path)).size
  after += sizeAfter
  console.log(
    `[v0] ${file}: ${(sizeBefore / 1024 / 1024).toFixed(2)} MB -> ${(sizeAfter / 1024).toFixed(0)} KB`,
  )
}

console.log(
  `[v0] TOTAL: ${(before / 1024 / 1024).toFixed(1)} MB -> ${(after / 1024 / 1024).toFixed(1)} MB (${files.length} archivos)`,
)
