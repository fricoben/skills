import fs from 'node:fs/promises'
import path from 'node:path'
import exifr from 'exifr'
import PhotoGallery from './PhotoGallery'
import Link from 'next/link'
import type { Photo } from './types'
import type { Metadata } from 'next'

type PhotoLocal = Photo

export const revalidate = 3600

const photoMetaCache = new Map<string, PhotoLocal>()

async function readPhotosDirectory(): Promise<string[]> {
  const photosDir = path.join(process.cwd(), 'public', 'images', 'photos')
  try {
    const entries = await fs.readdir(photosDir, { withFileTypes: true })
    return entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
      .sort()
  } catch {
    return []
  }
}

function buildCaption(meta: any): string | null {
  if (!meta) return null
  const parts: string[] = []
  const location = [meta.City, meta.State, meta.Country]
    .filter(Boolean)
    .join(', ')
  if (location) parts.push(location)
  if (meta.CreateDate || meta.DateTimeOriginal) {
    const dt = (meta.CreateDate || meta.DateTimeOriginal) as Date | string
    try {
      const d = new Date(dt)
      if (!Number.isNaN(d.getTime())) parts.push(d.toLocaleDateString())
    } catch {}
  }
  if (meta.latitude && meta.longitude) {
    parts.push(
      `${meta.latitude.toFixed?.(5) ?? meta.latitude}, ${
        meta.longitude.toFixed?.(5) ?? meta.longitude
      }`
    )
  }
  return parts.length ? parts.join(' · ') : null
}

function pickDescription(meta: any): string | null {
  if (!meta) return null
  const candidates = [
    meta.ImageDescription,
    meta.Description,
    meta.XPComment,
    meta.UserComment,
    meta.Caption,
    meta['Caption-Abstract'],
    meta.CaptionAbstract,
    meta.Headline,
    meta.Title,
    meta.XPTitle,
    meta.XPSubject,
    meta.ObjectName,
    meta.Subject
  ].filter(Boolean)
  return candidates.length ? String(candidates[0]) : null
}

function dmsToDecimal(dms: string, ref: string | undefined): number | null {
  // dms like "43 21 29.00" and ref like 'N' | 'S' | 'E' | 'W'
  if (!dms) return null
  const m = dms.match(/^(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)$/)
  if (!m) return null
  const deg = Number(m[1])
  const min = Number(m[2])
  const sec = Number(m[3])
  let val = deg + min / 60 + sec / 3600
  if (ref === 'S' || ref === 'W') val = -val
  return Number.isFinite(val) ? val : null
}

function buildLocationLabel(meta: any): string | null {
  // Prefer human fields if present; else fallback to computed lat/lon
  const human = [meta.City, meta.State, meta.Country].filter(Boolean).join(', ')
  if (human) return human
  const lat = meta.GPSLatitude ?? meta.latitude
  const lon = meta.GPSLongitude ?? meta.longitude
  const latRef = meta.GPSLatitudeRef
  const lonRef = meta.GPSLongitudeRef
  let latDec: number | null = null
  let lonDec: number | null = null
  if (typeof lat === 'string') latDec = dmsToDecimal(lat, latRef)
  if (typeof lon === 'string') lonDec = dmsToDecimal(lon, lonRef)
  if (typeof lat === 'number') latDec = lat
  if (typeof lon === 'number') lonDec = lon
  if (latDec != null && lonDec != null) {
    return `${latDec.toFixed(5)}, ${lonDec.toFixed(5)}`
  }
  return null
}

function extractXmp(xml: string, tag: string): string | null {
  const simple = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i')
  const m1 = xml.match(simple)
  if (m1) return m1[1].trim()
  // Handle Alt container like: <dc:description><rdf:Alt><rdf:li ...>text</rdf:li></rdf:Alt></dc:description>
  const alt = new RegExp(
    `<${tag}[^>]*>[^]*?<rdf:li[^>]*>([^<]+)</rdf:li>[^]*?</${tag}>`,
    'i'
  )
  const m2 = xml.match(alt)
  if (m2) return m2[1].trim()
  return null
}

function parseXmpMinimal(buf: Uint8Array): {
  caption: string | null
  city: string | null
  state: string | null
  country: string | null
} | null {
  try {
    const s = Buffer.from(buf).toString('utf8')
    const start = s.indexOf('<x:xmpmeta')
    const end = s.indexOf('</x:xmpmeta>')
    if (start === -1 || end === -1) return null
    const xml = s.slice(start, end + '</x:xmpmeta>'.length)
    const caption =
      extractXmp(xml, 'dc:description') ||
      extractXmp(xml, 'photoshop:Headline') ||
      extractXmp(xml, 'photoshop:Caption')
    const city =
      extractXmp(xml, 'photoshop:City') || extractXmp(xml, 'Iptc4xmpCore:City')
    const state =
      extractXmp(xml, 'photoshop:State') ||
      extractXmp(xml, 'Iptc4xmpCore:ProvinceState')
    const country =
      extractXmp(xml, 'Iptc4xmpCore:CountryName') ||
      extractXmp(xml, 'photoshop:Country')
    return { caption, city, state, country }
  } catch {
    return null
  }
}

async function getPhotoData(fileName: string): Promise<PhotoLocal> {
  const publicPath = `/images/photos/${fileName}`
  const absPath = path.join(
    process.cwd(),
    'public',
    'images',
    'photos',
    fileName
  )
  let width: number | null = null
  let height: number | null = null
  let caption: string | null = null
  let locationLabel: string | null = null

  const cached = photoMetaCache.get(absPath)
  if (cached) {
    return cached
  }

  try {
    const buf = await fs.readFile(absPath)
    const meta = await exifr.parse(buf, {
      xmp: true,
      iptc: true,
      gps: true,
      translateValues: false,
      pick: [
        'ImageDescription',
        'Description',
        'Caption-Abstract',
        'City',
        'State',
        'Province-State',
        'Country',
        'Country-PrimaryLocationName',
        'GPSLatitude',
        'GPSLongitude',
        'GPSLatitudeRef',
        'GPSLongitudeRef',
        'ExifImageWidth',
        'ExifImageHeight',
        'ImageWidth',
        'ImageLength',
        'PixelXDimension',
        'PixelYDimension',
        'CreateDate',
        'DateTimeOriginal'
      ]
    })
    if (meta) {
      // Common width/height keys vary by format
      width = (meta.ExifImageWidth ||
        meta.ImageWidth ||
        meta.PixelXDimension ||
        null) as number | null
      height = (meta.ExifImageHeight ||
        meta.ImageLength ||
        meta.PixelYDimension ||
        null) as number | null
      // Prefer EXIF textual description as caption
      const exifDescription = pickDescription(meta)
      const built = buildCaption(meta)
      caption = exifDescription || built || null
      locationLabel = buildLocationLabel(meta)
    }
    if (!meta || !caption) {
      const x = parseXmpMinimal(buf)
      if (x) {
        const builtLoc = [x.city, x.state, x.country].filter(Boolean).join(', ')
        caption = caption || x.caption || null
        locationLabel = locationLabel || builtLoc || null
      }
    }
  } catch {
    // ignore EXIF errors; fall back to nulls
    try {
      const buf = await fs.readFile(absPath)
      const x = parseXmpMinimal(buf)
      if (x) {
        const builtLoc = [x.city, x.state, x.country].filter(Boolean).join(', ')
        caption = x.caption || null
        locationLabel = builtLoc || null
      }
    } catch {}
  }

  const result = { src: publicPath, width, height, caption, locationLabel }
  photoMetaCache.set(absPath, result)
  return result
}

async function getPhotos(): Promise<PhotoLocal[]> {
  const files = await readPhotosDirectory()
  const photos = await Promise.all(files.map(getPhotoData))
  return photos
}

export const metadata: Metadata = {
  title: 'Art'
}

export default async function ArtPage({
  searchParams
}: {
  searchParams?: Promise<{ view?: 'grid' | 'large' }>
}) {
  const photos = await getPhotos()
  const sp = (await searchParams) ?? {}
  const view: 'grid' | 'large' = sp?.view === 'large' ? 'large' : 'grid'
  return (
    <>
      <h1>Art</h1>
      <p>Sometimes a feeling doesn't need words.</p>
      <div className="art-toggle">
        <div className="art-toggle-group">
          <Link
            href={{ pathname: '/art', query: { view: 'grid' } }}
            prefetch={false}
            className={`art-toggle-link${view === 'grid' ? ' is-active' : ''}`}
          >
            Grid
          </Link>
          <Link
            href={{ pathname: '/art', query: { view: 'large' } }}
            prefetch={false}
            className={`art-toggle-link${view === 'large' ? ' is-active' : ''}`}
          >
            Large
          </Link>
        </div>
      </div>
      <PhotoGallery photos={photos} view={view} />
    </>
  )
}
