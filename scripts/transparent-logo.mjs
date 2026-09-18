import sharp from "sharp"
import { mkdirSync } from "node:fs"

const src = process.argv[2]
const dest = process.argv[3] ?? "public/brand/true-roof.png"

mkdirSync("public/brand", { recursive: true })

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

for (let i = 0; i < data.length; i += 4) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  if (r > 236 && g > 236 && b > 236) {
    data[i + 3] = 0
  } else if (r > 210 && g > 210 && b > 210 && max - min < 16) {
    data[i + 3] = Math.max(0, Math.round(((255 - min) / 45) * 80))
  }
}

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim()
  .png()
  .toFile(dest)

console.log(`wrote ${dest}`)
