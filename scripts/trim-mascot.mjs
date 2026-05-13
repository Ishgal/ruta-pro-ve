import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join } from 'path'

const MASCOT_DIR = new URL('../public/mascot', import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, '$1')
  .replace(/%20/g, ' ')
const PADDING = 12 // px de margen que dejamos alrededor del zorro

const files = (await readdir(MASCOT_DIR)).filter(f => f.endsWith('.png'))

for (const file of files) {
  const path = join(MASCOT_DIR, file)
  const img = sharp(path)
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })

  // Encuentra los bordes del contenido no-transparente
  const { width, height, channels } = info
  if (channels < 4) { console.log(`${file} — sin canal alpha, saltando`); continue }

  let top = height, bottom = 0, left = width, right = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3]
      if (alpha > 10) {
        if (y < top) top = y
        if (y > bottom) bottom = y
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }

  // Aplica padding y clampea a los limites de la imagen
  top    = Math.max(0, top - PADDING)
  bottom = Math.min(height - 1, bottom + PADDING)
  left   = Math.max(0, left - PADDING)
  right  = Math.min(width - 1, right + PADDING)

  const cropW = right - left + 1
  const cropH = bottom - top + 1

  await sharp(path)
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toFile(path + '.tmp')

  // Reemplaza el original
  const { rename } = await import('fs/promises')
  await rename(path + '.tmp', path)

  const pct = Math.round((1 - (cropW * cropH) / (width * height)) * 100)
  console.log(`${file}: ${width}x${height} → ${cropW}x${cropH} (${pct}% recortado)`)
}

console.log('\nListo. Recarga el navegador para ver los cambios.')
