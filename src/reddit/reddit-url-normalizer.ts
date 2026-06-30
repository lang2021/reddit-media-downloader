import type {
  RedditMediaQuality,
  RedditMediaSource,
  RedditMediaType,
} from './reddit-types.ts'

const mediaExtPattern = /\.(jpe?g|png|webp|avif|gif|gifv|mp4|webm|m3u8|mpd)$/i
const imageExtPattern = /\.(jpe?g|png|webp|avif)$/i
const trackingParams = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
])

export function normalizeRedditMediaUrl(url: string): string | null {
  const decoded = decodeHtmlEntities(url).trim()
  if (!decoded) return null

  try {
    const parsed = new URL(
      decoded.startsWith('//') ? `https:${decoded}` : decoded,
      globalThis.location?.href ?? 'https://www.reddit.com/'
    )

    for (const key of Array.from(parsed.searchParams.keys())) {
      const cleanKey = key.replace(/^amp;/, '')
      const value = parsed.searchParams.get(key)
      if (key !== cleanKey) {
        parsed.searchParams.delete(key)
        if (value !== null) parsed.searchParams.set(cleanKey, value)
      }
    }

    for (const key of trackingParams) parsed.searchParams.delete(key)
    return parsed.href
  } catch {
    return null
  }
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#38;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&#x2F;', '/')
}

export function parseSrcset(srcset: string): string[] {
  return srcset
    .split(',')
    .map(part => part.trim().split(/\s+/)[0])
    .filter(Boolean)
}

export function getBestSrcsetUrl(srcset: string): string | undefined {
  const candidates = srcset
    .split(',')
    .map(part => {
      const [url, descriptor = '1x'] = part.trim().split(/\s+/)
      const score = descriptor.endsWith('w')
        ? Number.parseInt(descriptor, 10)
        : descriptor.endsWith('x')
          ? Number.parseFloat(descriptor) * 1000
          : 0
      return { url, score: Number.isFinite(score) ? score : 0 }
    })
    .filter(candidate => candidate.url)
    .sort((a, b) => b.score - a.score)

  return candidates[0]?.url
}

export function mediaIdentityKey(url: string): string {
  const parsed = new URL(url)
  const pathname = parsed.pathname
    .replace(/\/(?:preview|external-preview)\//i, '/')
    .replace(/[-_](?:thumbnail|thumb|preview)(?=\.)/i, '')
  return `${parsed.hostname.replace(/^preview\.|^external-preview\./, '')}${pathname}`
}

export function classifyRedditMediaUrl(url: string): RedditMediaType {
  const parsed = new URL(url)
  const pathname = parsed.pathname.toLowerCase()

  if (pathname.endsWith('.m3u8') || pathname.endsWith('.mpd')) {
    return 'unsupported'
  }
  if (pathname.endsWith('.gif') || pathname.endsWith('.gifv')) return 'gif'
  if (pathname.endsWith('.mp4') || pathname.endsWith('.webm')) return 'video'
  if (imageExtPattern.test(pathname)) return 'image'
  if (parsed.hostname === 'i.redd.it') return 'image'
  if (parsed.hostname.endsWith('v.redd.it')) return 'video'
  return 'unsupported'
}

export function getRedditMediaSource(url: string): RedditMediaSource {
  const hostname = new URL(url).hostname
  if (hostname === 'i.redd.it') return 'i.redd.it'
  if (hostname === 'preview.redd.it') return 'preview.redd.it'
  if (hostname === 'external-preview.redd.it') return 'external-preview.redd.it'
  if (hostname.endsWith('v.redd.it')) return 'v.redd.it'
  if (hostname.endsWith('reddit.com') || hostname.endsWith('redd.it')) {
    return 'dom'
  }
  return 'external'
}

export function getRedditMediaQuality(url: string): RedditMediaQuality {
  const parsed = new URL(url)
  const text = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase()
  if (parsed.hostname === 'i.redd.it') return 'original'
  if (text.includes('thumbnail') || text.includes('thumb')) return 'thumbnail'
  if (
    parsed.hostname === 'preview.redd.it' ||
    parsed.hostname === 'external-preview.redd.it'
  ) {
    return 'preview'
  }
  return 'unknown'
}

export function inferExtensionFromUrl(url: string, type?: RedditMediaType): string {
  const parsed = new URL(url)
  const pathname = parsed.pathname.toLowerCase()
  const match = pathname.match(mediaExtPattern)
  if (match) return `.${match[1].replace('jpeg', 'jpg')}`

  const format = parsed.searchParams.get('format')
  if (format) return `.${format.replace('jpeg', 'jpg')}`

  switch (type ?? classifyRedditMediaUrl(url)) {
    case 'gif':
      return '.gif'
    case 'video':
      return '.mp4'
    case 'image':
      return '.jpg'
    default:
      return ''
  }
}

export function isFilteredRedditAsset(url: string, element?: Element): boolean {
  const parsed = new URL(url)
  const text = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase()
  const assetWords = [
    'avatar',
    'snoovatar',
    'award',
    'emoji',
    'sprite',
    'icon',
    'logo',
    'tracking',
    'pixel',
    'thumbnail',
    'thumb',
  ]

  if (assetWords.some(word => text.includes(word))) return true

  if (element) {
    const elementText = [
      element.getAttribute('alt'),
      element.getAttribute('aria-label'),
      element.getAttribute('class'),
      element.closest('[aria-label]')?.getAttribute('aria-label'),
      element.closest('[class]')?.getAttribute('class'),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (assetWords.some(word => elementText.includes(word))) return true
  }

  if (element instanceof HTMLImageElement) {
    const tiny =
      element.naturalWidth > 0 &&
      element.naturalHeight > 0 &&
      element.naturalWidth < 120 &&
      element.naturalHeight < 120
    if (tiny && parsed.hostname !== 'i.redd.it') return true
  }

  return false
}

export function qualityScore(quality: RedditMediaQuality | undefined): number {
  switch (quality) {
    case 'original':
      return 4
    case 'preview':
      return 3
    case 'unknown':
      return 2
    case 'thumbnail':
      return 1
    default:
      return 0
  }
}
