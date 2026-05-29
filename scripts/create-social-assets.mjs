import fs from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const root = process.cwd()
const outputDir = path.join(root, "public", "social-assets")
const familyArtwork = path.join(root, "public", "little-legends-reading-hero-family.png")
const signatureArtwork = path.join(root, "public", "email-signature.jpg")

const gold = "#ffe68a"
const navy = "#070016"
const white = "#fffaf0"
const rose = "#ff8ec3"

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")

const svg = ({ width, height, body }) => Buffer.from(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`)

const background = async ({ width, height, source = familyArtwork, brightness = 1.08, saturation = 1.12 }) =>
  sharp(source)
    .resize(width, height, { fit: "cover", position: "centre" })
    .modulate({ brightness, saturation })
    .png()
    .toBuffer()

const makeProfile = async () => {
  const width = 1080
  const height = 1080
  const base = await background({ width, height, brightness: 1.16, saturation: 1.18 })
  const overlay = svg({
    width,
    height,
    body: `
      <defs>
        <radialGradient id="softGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="${navy}" stop-opacity="0.78"/>
        </radialGradient>
        <linearGradient id="badge" x1="0" x2="1">
          <stop offset="0%" stop-color="#fff2a8"/>
          <stop offset="100%" stop-color="#ffc95e"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1080" fill="url(#softGlow)"/>
      <circle cx="540" cy="342" r="166" fill="${navy}" fill-opacity="0.78" stroke="url(#badge)" stroke-width="12"/>
      <circle cx="540" cy="342" r="105" fill="url(#badge)"/>
      <path d="M540 424 C455 360 424 326 424 281 C424 238 456 210 497 210 C522 210 542 224 554 246 C567 224 591 210 618 210 C658 210 690 239 690 281 C690 330 650 367 540 424Z" fill="${rose}"/>
      <path d="M334 540 H746" stroke="${gold}" stroke-width="5" stroke-linecap="round" opacity="0.75"/>
      <text x="540" y="625" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="800" fill="${white}">Little Legends</text>
      <text x="540" y="705" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-weight="800" fill="${gold}">Story</text>
      <text x="540" y="790" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="3" fill="${white}">YOUR CHILD. THE HERO.</text>
      <text x="245" y="228" font-size="44" fill="${gold}">✦</text>
      <text x="792" y="236" font-size="42" fill="${gold}">✦</text>
      <text x="232" y="776" font-size="38" fill="${rose}">♥</text>
      <text x="806" y="778" font-size="38" fill="${rose}">♥</text>
    `,
  })

  await sharp(base)
    .composite([{ input: overlay }])
    .png({ quality: 95 })
    .toFile(path.join(outputDir, "little-legends-profile-1080.png"))
}

const makeBanner = async ({ width, height, fileName, titleSize, taglineSize }) => {
  const base = await background({ width, height, brightness: 1.18, saturation: 1.2 })
  const overlay = svg({
    width,
    height,
    body: `
      <defs>
        <linearGradient id="shade" x1="0" x2="1">
          <stop offset="0%" stop-color="${navy}" stop-opacity="0.95"/>
          <stop offset="44%" stop-color="${navy}" stop-opacity="0.72"/>
          <stop offset="72%" stop-color="${navy}" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="${navy}" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="pill" x1="0" x2="1">
          <stop offset="0%" stop-color="#fff1a8"/>
          <stop offset="100%" stop-color="#ffc45f"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shade)"/>
      <text x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.24)}" font-family="Arial, sans-serif" font-size="${Math.round(taglineSize * 0.48)}" font-weight="800" letter-spacing="8" fill="${gold}">LITTLE LEGENDS STORY</text>
      <text x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.47)}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="800" fill="${white}">Your child.</text>
      <text x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.66)}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="800" fill="${gold}">The hero.</text>
      <rect x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.75)}" rx="${Math.round(height * 0.045)}" width="${Math.round(width * 0.34)}" height="${Math.round(height * 0.11)}" fill="url(#pill)"/>
      <text x="${Math.round(width * 0.24)}" y="${Math.round(height * 0.823)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${taglineSize}" font-weight="900" fill="${navy}">Personalised magical storybooks</text>
      <text x="${Math.round(width * 0.82)}" y="${Math.round(height * 0.18)}" font-size="${Math.round(height * 0.055)}" fill="${gold}">✦</text>
      <text x="${Math.round(width * 0.92)}" y="${Math.round(height * 0.72)}" font-size="${Math.round(height * 0.05)}" fill="${rose}">♥</text>
    `,
  })

  await sharp(base)
    .composite([{ input: overlay }])
    .png({ quality: 95 })
    .toFile(path.join(outputDir, fileName))
}

const makePost = async () => {
  const width = 1080
  const height = 1080
  const base = await background({ width, height, source: signatureArtwork, brightness: 1.16, saturation: 1.15 })
  const overlay = svg({
    width,
    height,
    body: `
      <defs>
        <linearGradient id="shade" y1="0" y2="1">
          <stop offset="0%" stop-color="${navy}" stop-opacity="0.2"/>
          <stop offset="54%" stop-color="${navy}" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="${navy}" stop-opacity="0.88"/>
        </linearGradient>
        <linearGradient id="pill" x1="0" x2="1">
          <stop offset="0%" stop-color="#fff1a8"/>
          <stop offset="100%" stop-color="#ffc45f"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1080" fill="url(#shade)"/>
      <text x="70" y="100" font-family="Arial, sans-serif" font-size="34" font-weight="900" letter-spacing="7" fill="${gold}">LITTLE LEGENDS STORY</text>
      <rect x="70" y="784" rx="42" width="940" height="180" fill="${navy}" fill-opacity="0.82" stroke="${gold}" stroke-width="3"/>
      <text x="540" y="862" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="800" fill="${white}">Turn your child into</text>
      <text x="540" y="928" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="62" font-weight="800" fill="${gold}">the hero</text>
      <text x="540" y="1000" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="${white}">Personalised magical storybooks</text>
      <text x="918" y="118" font-size="46" fill="${rose}">♥</text>
    `,
  })

  await sharp(base)
    .composite([{ input: overlay }])
    .png({ quality: 95 })
    .toFile(path.join(outputDir, "little-legends-instagram-post-1080.png"))
}

await fs.mkdir(outputDir, { recursive: true })
await makeProfile()
await makeBanner({ width: 1500, height: 500, fileName: "little-legends-x-header-1500x500.png", titleSize: 92, taglineSize: 32 })
await makeBanner({ width: 1640, height: 624, fileName: "little-legends-facebook-cover-1640x624.png", titleSize: 108, taglineSize: 36 })
await makePost()

console.log(`Social assets written to ${outputDir}`)
