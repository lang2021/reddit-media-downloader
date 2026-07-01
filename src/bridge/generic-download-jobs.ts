import {
  inferExtensionFromUrl,
  mediaIdentityKey,
  normalizeRedditMediaUrl,
} from '../reddit/reddit-url-normalizer.ts'
import type {
  GenericDownloadJob,
  GenericMediaItem,
  GenericMediaPostContext,
} from './generic-media-types.ts'

type DownloadJobOptions = {
  mode?: 'chrome' | 'aria2'
  filenameTemplate?: string
  indexPad?: number
}

export const DEFAULT_REDDIT_DOWNLOAD_DIRECTORY = 'reddit_media_harvest'

const defaultFilenameTemplate =
  '{platform}_{community}_{author}_{postId}_{index}.{ext}'

export function genericMediaContextToDownloadJobs(
  context: GenericMediaPostContext,
  options: DownloadJobOptions = {}
): GenericDownloadJob[] {
  return dedupeMedia(context)
    .map((item, jobIndex) => {
      const index = item.index + 1 || jobIndex + 1
      return {
        url: item.url ?? '',
        filename: withDefaultDownloadDirectory(
          context,
          makeFilename({
            context,
            item,
            index,
            indexPad: options.indexPad,
            template: options.filenameTemplate ?? defaultFilenameTemplate,
          })
        ),
        ...(options.mode ? { mode: options.mode } : {}),
        metadata: {
          platform: context.platform,
          postId: context.postId,
          mediaType: item.type,
          index,
        },
      }
    })
}

function dedupeMedia(context: GenericMediaPostContext): GenericMediaItem[] {
  const seen = new Set<string>()
  return context.media
    .filter(item => item.type !== 'unsupported' && item.url)
    .filter(item => {
      const key = mediaKey(context, item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function mediaKey(
  context: GenericMediaPostContext,
  item: GenericMediaItem
): string {
  if (context.platform !== 'reddit') return item.url ?? ''

  const normalized = normalizeRedditMediaUrl(item.url ?? '')
  return normalized ? mediaIdentityKey(normalized) : item.url ?? ''
}

function withDefaultDownloadDirectory(
  context: GenericMediaPostContext,
  filename: string
): string {
  return context.platform === 'reddit'
    ? `${DEFAULT_REDDIT_DOWNLOAD_DIRECTORY}/${filename}`
    : filename
}

function makeFilename({
  context,
  item,
  index,
  indexPad,
  template,
}: {
  context: GenericMediaPostContext
  item: GenericMediaItem
  index: number
  indexPad?: number
  template: string
}): string {
  const url = item.url ?? ''
  const ext = stripDot(inferExtensionFromUrl(url, item.type))
  const values: Record<string, string> = {
    platform: context.platform,
    community: context.community ?? 'unknown',
    author: context.author ?? 'unknown',
    postId: context.postId,
    index: String(index).padStart(indexPad ?? 1, '0'),
    ext,
  }

  const filename = template.replace(
    /\{(platform|community|author|postId|index|ext)\}/g,
    (_match, token: keyof typeof values) => sanitizeFilenamePart(values[token])
  )

  return filename.replace(/\.+$/, '')
}

function sanitizeFilenamePart(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unknown'
}

function stripDot(ext: string): string {
  return ext.startsWith('.') ? ext.slice(1) : ext
}
