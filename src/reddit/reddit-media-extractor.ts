import {
  extractRedditPostMetadata,
  isRedditPostElement,
} from './reddit-post-detector.ts'
import type {
  RawRedditMediaCandidate,
  RedditMediaContext,
  RedditMediaItem,
  RedditMediaQuality,
  RedditMediaType,
} from './reddit-types.ts'
import {
  classifyRedditMediaUrl,
  getBestSrcsetUrl,
  getRedditMediaQuality,
  getRedditMediaSource,
  inferExtensionFromUrl,
  isFilteredRedditAsset,
  mediaIdentityKey,
  normalizeRedditMediaUrl,
  qualityScore,
} from './reddit-url-normalizer.ts'
import {
  extractRedditVideoCandidates,
  isUnsupportedVideoManifest,
} from './reddit-video-extractor.ts'

const mediaUrlPattern =
  /https?:\\?\/\\?\/[^\s"'<>]*(?:i\.redd\.it|preview\.redd\.it|external-preview\.redd\.it|v\.redd\.it|\.gifv?|\.mp4|\.webm|\.m3u8|\.mpd)[^\s"'<>]*/gi

let candidateOrder = 0

export function extractRedditMediaFromPostElement(
  postElement: Element
): RedditMediaContext | null {
  if (!isRedditPostElement(postElement)) return null

  const metadata = extractRedditPostMetadata(postElement)
  if (!metadata) return null

  const warnings = new Set<string>()
  const candidates = collectRawCandidates(postElement)
  const media = normalizeCandidates(candidates, warnings)

  if (media.length === 0) return null

  media.forEach((item, index) => {
    item.index = index
  })

  return {
    platform: 'reddit',
    ...metadata,
    media,
    warnings: Array.from(warnings),
  }
}

function collectRawCandidates(postElement: Element): RawRedditMediaCandidate[] {
  candidateOrder = 0
  return [
    ...extractImageCandidates(postElement),
    ...extractLinkCandidates(postElement),
    ...extractBackgroundCandidates(postElement),
    ...extractAttributeCandidates(postElement),
    ...extractLocalJsonCandidates(postElement),
    ...extractRedditVideoCandidates(postElement),
  ]
}

function extractImageCandidates(postElement: Element): RawRedditMediaCandidate[] {
  const candidates: RawRedditMediaCandidate[] = []

  for (const img of Array.from(postElement.querySelectorAll('img'))) {
    if (img.closest('picture')?.querySelector('source[src], source[srcset]')) {
      continue
    }

    const srcsetBest = img.getAttribute('srcset')
      ? getBestSrcsetUrl(img.getAttribute('srcset') ?? '')
      : undefined
    const src = srcsetBest ?? img.getAttribute('src')
    if (src && !isFilteredCandidate(src, img)) {
      candidates.push({
        url: src,
        kind: src.toLowerCase().includes('.gif') ? 'gif' : 'image',
        order: nextCandidateOrder(),
      })
    }
  }

  for (const source of Array.from(postElement.querySelectorAll('source'))) {
    const src =
      source.getAttribute('src') ??
      getBestSrcsetUrl(source.getAttribute('srcset') ?? '')
    if (src && !isFilteredCandidate(src, source)) {
      candidates.push({ url: src, order: nextCandidateOrder() })
    }
  }

  return candidates
}

function extractLinkCandidates(postElement: Element): RawRedditMediaCandidate[] {
  const candidates: RawRedditMediaCandidate[] = []

  for (const anchor of Array.from(postElement.querySelectorAll('a[href]'))) {
    const href = anchor.getAttribute('href')
    if (!href || isFilteredCandidate(href, anchor)) continue
    if (!looksLikeMediaUrl(href)) continue
    candidates.push({ url: href, order: nextCandidateOrder() })
  }

  return candidates
}

function extractBackgroundCandidates(
  postElement: Element
): RawRedditMediaCandidate[] {
  const candidates: RawRedditMediaCandidate[] = []

  for (const element of Array.from(postElement.querySelectorAll('[style]'))) {
    const style = element.getAttribute('style') ?? ''
    for (const match of style.matchAll(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi)) {
      const url = match[1]
      if (!isFilteredCandidate(url, element)) {
        candidates.push({ url, kind: 'image', order: nextCandidateOrder() })
      }
    }
  }

  return candidates
}

function extractAttributeCandidates(
  postElement: Element
): RawRedditMediaCandidate[] {
  const candidates: RawRedditMediaCandidate[] = []
  const scopedSelectors = 'shreddit-gallery, [data-media], [data-url], [data-src], [data-image-url]'

  for (const element of Array.from(postElement.querySelectorAll(scopedSelectors))) {
    for (const attr of Array.from(element.attributes)) {
      if (!looksLikeMediaUrl(attr.value) || isFilteredCandidate(attr.value, element)) {
        continue
      }
      candidates.push({ url: attr.value, order: nextCandidateOrder() })
    }
  }

  return candidates
}

function extractLocalJsonCandidates(
  postElement: Element
): RawRedditMediaCandidate[] {
  const candidates: RawRedditMediaCandidate[] = []

  for (const script of Array.from(
    postElement.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]')
  )) {
    const text = script.textContent ?? ''
    for (const match of text.matchAll(mediaUrlPattern)) {
      const url = match[0].replaceAll('\\/', '/')
      if (!isFilteredCandidate(url, script)) {
        candidates.push({ url, source: 'json', order: nextCandidateOrder() })
      }
    }
  }

  return candidates
}

function normalizeCandidates(
  candidates: RawRedditMediaCandidate[],
  warnings: Set<string>
): RedditMediaItem[] {
  const byUrl = new Map<string, RedditMediaItem>()
  const byIdentity = new Map<string, RedditMediaItem>()
  const orderByUrl = new Map<string, number>()
  const unsupported: RedditMediaItem[] = []

  for (const candidate of candidates) {
    const normalized = normalizeRedditMediaUrl(candidate.url)
    if (!normalized) continue

    if (candidate.fromPoster) {
      unsupported.push({
        type: 'unsupported',
        url: normalized,
        unsupportedReason: 'video_poster_only',
      })
      warnings.add('video_poster_only')
      continue
    }

    if (isUnsupportedVideoManifest(normalized)) {
      unsupported.push({
        type: 'unsupported',
        url: normalized,
        unsupportedReason: 'video_requires_manifest_or_audio_merge',
      })
      warnings.add('video_requires_manifest_or_audio_merge')
      continue
    }

    const type = pickType(candidate.kind, normalized)
    if (type === 'unsupported') {
      unsupported.push({
        type: 'unsupported',
        url: normalized,
        unsupportedReason: unsupportedReasonFor(normalized),
      })
      continue
    }

    const quality = candidate.quality ?? getRedditMediaQuality(normalized)
    const item: RedditMediaItem = {
      type,
      url: normalized,
      source: candidate.source === 'json' ? 'json' : getRedditMediaSource(normalized),
      quality,
      ext: inferExtensionFromUrl(normalized, type),
    }

    const identity = mediaIdentityKey(normalized)
    const current = byUrl.get(normalized) ?? byIdentity.get(identity)
    const currentUrl = current?.url
    if (!current || shouldReplaceMedia(current, item)) {
      if (currentUrl) byUrl.delete(currentUrl)
      byUrl.set(normalized, item)
      byIdentity.set(identity, item)
      orderByUrl.set(normalized, candidate.order ?? nextCandidateOrder())
    }
  }

  const supported = Array.from(byUrl.values()).sort((a, b) =>
    mediaSort(a, b, orderByUrl)
  )
  if (supported.length > 0) return supported
  return unsupported.slice(0, 1)
}

function pickType(
  hintedType: RedditMediaType | undefined,
  normalized: string
): RedditMediaType {
  if (hintedType && hintedType !== 'unsupported') return hintedType
  return classifyRedditMediaUrl(normalized)
}

function unsupportedReasonFor(url: string): string {
  return url.toLowerCase().includes('.gifv')
    ? 'external_gif_adapter_not_supported'
    : 'unsupported_media_url'
}

function shouldReplaceMedia(
  current: RedditMediaItem,
  next: RedditMediaItem
): boolean {
  const qualityDelta = qualityScore(next.quality) - qualityScore(current.quality)
  if (qualityDelta !== 0) return qualityDelta > 0
  return (next.url ?? '').length > (current.url ?? '').length
}

function mediaSort(
  a: RedditMediaItem,
  b: RedditMediaItem,
  orderByUrl: Map<string, number>
): number {
  return (
    (orderByUrl.get(a.url ?? '') ?? 0) - (orderByUrl.get(b.url ?? '') ?? 0)
  )
}

function looksLikeMediaUrl(value: string): boolean {
  return Boolean(
    value.match(
      /(i\.redd\.it|preview\.redd\.it|external-preview\.redd\.it|v\.redd\.it|\.jpe?g|\.png|\.webp|\.avif|\.gifv?|\.mp4|\.webm|\.m3u8|\.mpd)/i
    )
  )
}

function isFilteredCandidate(value: string, element: Element): boolean {
  const normalized = normalizeRedditMediaUrl(value)
  return normalized ? isFilteredRedditAsset(normalized, element) : true
}

function nextCandidateOrder(): number {
  candidateOrder += 1
  return candidateOrder
}
