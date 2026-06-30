import type { RawRedditMediaCandidate } from './reddit-types.ts'
import { normalizeRedditMediaUrl } from './reddit-url-normalizer.ts'

export function extractRedditVideoCandidates(
  postElement: Element
): RawRedditMediaCandidate[] {
  const candidates: RawRedditMediaCandidate[] = []

  for (const video of Array.from(postElement.querySelectorAll('video'))) {
    let hasPlayableSource = false
    const src = video.currentSrc || video.getAttribute('src')
    if (src) {
      hasPlayableSource = true
      candidates.push({ url: src, kind: 'video', source: 'dom' })
    }

    for (const source of Array.from(video.querySelectorAll('source[src]'))) {
      const sourceSrc = source.getAttribute('src')
      if (sourceSrc) {
        hasPlayableSource = true
        candidates.push({ url: sourceSrc, kind: 'video', source: 'dom' })
      }
    }

    const poster = video.getAttribute('poster')
    if (poster && !hasPlayableSource) {
      candidates.push({
        url: poster,
        kind: 'unsupported',
        source: 'dom',
        fromPoster: true,
      })
    }
  }

  for (const element of Array.from(
    postElement.querySelectorAll('[src*=".mp4"], [href*=".mp4"], [src*="v.redd.it"], [href*="v.redd.it"], [src*=".m3u8"], [href*=".m3u8"], [src*=".mpd"], [href*=".mpd"]')
  )) {
    for (const attr of ['src', 'href']) {
      const value = element.getAttribute(attr)
      if (value) candidates.push({ url: value, kind: 'video', source: 'dom' })
    }
  }

  return dedupeCandidates(candidates)
}

export function isUnsupportedVideoManifest(url: string): boolean {
  const normalized = normalizeRedditMediaUrl(url)
  if (!normalized) return false
  const pathname = new URL(normalized).pathname.toLowerCase()
  return pathname.endsWith('.m3u8') || pathname.endsWith('.mpd')
}

function dedupeCandidates(
  candidates: RawRedditMediaCandidate[]
): RawRedditMediaCandidate[] {
  const seen = new Set<string>()
  return candidates.filter(candidate => {
    const normalized = normalizeRedditMediaUrl(candidate.url)
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}
