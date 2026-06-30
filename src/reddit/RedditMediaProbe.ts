import { findRedditPostElements } from './reddit-post-detector.ts'
import { extractRedditMediaFromPostElement } from './reddit-media-extractor.ts'
import type { RedditMediaContext } from './reddit-types.ts'

export type RedditMediaProbeResult = {
  totalCandidates: number
  extractedPosts: RedditMediaContext[]
  unsupportedPosts: Array<{
    postId?: string
    reason: string
  }>
}

export function probeRedditMedia(root: ParentNode = document): RedditMediaProbeResult {
  const candidates = findRedditPostElements(root)
  const extractedPosts: RedditMediaContext[] = []
  const unsupportedPosts: RedditMediaProbeResult['unsupportedPosts'] = []

  for (const element of candidates) {
    const context = extractRedditMediaFromPostElement(element)
    if (!context) {
      unsupportedPosts.push({ reason: 'no_media_context' })
      continue
    }

    extractedPosts.push(context)
    if (context.media.every(item => item.type === 'unsupported')) {
      unsupportedPosts.push({
        postId: context.postId,
        reason:
          context.media[0]?.unsupportedReason ??
          context.warnings?.[0] ??
          'unsupported_media',
      })
    }
  }

  return {
    totalCandidates: candidates.length,
    extractedPosts,
    unsupportedPosts,
  }
}

export function logRedditMediaProbe(root: ParentNode = document): RedditMediaProbeResult {
  const result = probeRedditMedia(root)
  console.info('[RedditMediaProbe]', result)
  return result
}

