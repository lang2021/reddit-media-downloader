import { inferExtensionFromUrl } from '../reddit/reddit-url-normalizer.ts'
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

const defaultFilenameTemplate =
  '{platform}_{community}_{author}_{postId}_{index}.{ext}'

export function genericMediaContextToDownloadJobs(
  context: GenericMediaPostContext,
  options: DownloadJobOptions = {}
): GenericDownloadJob[] {
  return context.media
    .filter(item => item.type !== 'unsupported' && item.url)
    .map((item, jobIndex) => {
      const index = item.index + 1 || jobIndex + 1
      return {
        url: item.url ?? '',
        filename: makeFilename({
          context,
          item,
          index,
          indexPad: options.indexPad,
          template: options.filenameTemplate ?? defaultFilenameTemplate,
        }),
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
