import sharp from 'sharp'

export interface WatermarkOptions {
  latitude: number
  longitude: number
  locationName?: string
  serverTime: Date
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Composites a semi-transparent bottom-left watermark with lat/lng + time.
 */
export async function watermarkPhoto(
  buffer: Buffer,
  opts: WatermarkOptions,
): Promise<Buffer> {
  const base = sharp(buffer).rotate()
  const meta = await base.metadata()

  const width = meta.width ?? 1024
  const height = meta.height ?? 1024

  const lines: string[] = []
  lines.push(
    `${opts.latitude.toFixed(6)}, ${opts.longitude.toFixed(6)}`,
  )
  if (opts.locationName) lines.push(opts.locationName)
  lines.push(opts.serverTime.toISOString())

  const fontSize = Math.max(14, Math.round(width * 0.022))
  const lineHeight = Math.round(fontSize * 1.35)
  const paddingX = Math.round(fontSize * 0.7)
  const paddingY = Math.round(fontSize * 0.5)

  // Estimate text block width (rough)
  const maxLineChars = Math.max(...lines.map((l) => l.length))
  const boxWidth = Math.min(
    width - 20,
    Math.round(maxLineChars * fontSize * 0.6) + paddingX * 2,
  )
  const boxHeight = lineHeight * lines.length + paddingY * 2

  const boxX = 10
  const boxY = height - boxHeight - 10

  const textElements = lines
    .map((line, i) => {
      const y = boxY + paddingY + lineHeight * (i + 1) - Math.round(lineHeight * 0.25)
      return `<text x="${boxX + paddingX}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#ffffff">${escapeXml(line)}</text>`
    })
    .join('')

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" fill="rgba(0,0,0,0.55)" rx="6" ry="6"/>
    ${textElements}
  </svg>`

  return await base
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer()
}
