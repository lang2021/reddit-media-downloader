import type { RedditMediaContext } from '../reddit/reddit-types.ts'
import type { GenericMediaPostContext } from './generic-media-types.ts'

export function redditMediaContextToGenericMediaContext(
  context: RedditMediaContext
): GenericMediaPostContext {
  return {
    platform: 'reddit',
    postId: context.postId,
    author: cleanUserPrefix(context.author),
    community: normalizeRedditCommunity(context.subreddit),
    title: context.title,
    permalink: context.permalink,
    warnings: context.warnings,
    media: context.media.map((item, index) => ({
      type: item.type,
      url: item.url,
      index: item.index ?? index,
      filenameHint: item.filenameHint,
      source: item.source,
      quality: item.quality,
      unsupportedReason: item.unsupportedReason,
    })),
  }
}

function normalizeRedditCommunity(value: string | undefined): string | undefined {
  if (!value) return undefined
  const clean = value.replace(/^\/?r\//i, '')
  return clean ? `r/${clean}` : undefined
}

function cleanUserPrefix(value: string | undefined): string | undefined {
  return value?.replace(/^\/?(?:u|user)\//i, '') || undefined
}

