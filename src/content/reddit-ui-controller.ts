import { genericMediaContextToDownloadJobs } from '../bridge/generic-download-jobs.ts'
import type { GenericMediaPostContext } from '../bridge/generic-media-types.ts'
import { redditMediaContextToGenericMediaContext } from '../bridge/reddit-to-generic-media.ts'
import type {
  StartDownloadRequest,
  StartDownloadResponse,
} from '../messages/download-messages.ts'
import { RedditMediaObserver } from '../reddit/RedditMediaObserver.ts'
import { extractRedditMediaFromPostElement } from '../reddit/reddit-media-extractor.ts'
import {
  classifyRedditMediaUrl,
  getRedditMediaQuality,
  getRedditMediaSource,
  normalizeRedditMediaUrl,
} from '../reddit/reddit-url-normalizer.ts'
import {
  applyRedditDownloadButtonState,
  injectRedditDryRunButton,
} from './reddit-injected-button.ts'
import {
  hasDownloadedRedditPost,
  markRedditPostDownloaded,
} from './reddit-downloaded-posts.ts'

type DownloadClient = (
  request: StartDownloadRequest
) => Promise<StartDownloadResponse>

type RedditDryRunUIControllerOptions = {
  root?: HTMLElement
  downloadClient?: DownloadClient
}

export class RedditDryRunUIController {
  private observer?: RedditMediaObserver
  private readonly downloadClient: DownloadClient

  constructor(private readonly options: RedditDryRunUIControllerOptions = {}) {
    this.downloadClient = options.downloadClient ?? sendStartDownloadRequest
  }

  start(): void {
    if (this.observer) return

    const root = this.options.root ?? document.body
    this.observer = new RedditMediaObserver({
      root,
      onPostMedia: (context, element) => {
        const button = injectRedditDryRunButton(element, () => {
          void runRedditDryRunForPost(element, this.downloadClient).then(response =>
            this.markDownloadedAfterSuccess(context.postId, button, response)
          )
        })
        if (button) void this.refreshDownloadedState(context.postId, button)
      },
    })
    this.observer.start()
  }

  stop(): void {
    this.observer?.stop()
    this.observer = undefined
  }

  private async refreshDownloadedState(
    postId: string,
    button: HTMLButtonElement
  ): Promise<void> {
    if (await hasDownloadedRedditPost(postId)) {
      applyRedditDownloadButtonState(button, 'downloaded')
    }
  }

  private async markDownloadedAfterSuccess(
    postId: string,
    button: HTMLButtonElement | null,
    response: StartDownloadResponse | null
  ): Promise<void> {
    if (!button || !isFullySuccessfulRealDownload(response)) return
    await markRedditPostDownloaded(postId)
    applyRedditDownloadButtonState(button, 'downloaded')
  }
}

function isFullySuccessfulRealDownload(
  response: StartDownloadResponse | null
): response is StartDownloadResponse {
  return Boolean(
    response?.realDownloadExecuted &&
      response.results.length > 0 &&
      response.results.every(result => result.ok)
  )
}

export function runRedditDryRunForPost(
  postElement: Element,
  downloadClient: DownloadClient = sendStartDownloadRequest
): Promise<StartDownloadResponse | null> {
  const redditContext = extractRedditMediaFromPostElement(postElement)
  if (!redditContext) return Promise.resolve(null)

  return completeRedditGalleryImages(
    postElement,
    redditMediaContextToGenericMediaContext(redditContext)
  ).then(context => {
    const genericContext = keepImageMediaOnly(context)
    const jobs = genericMediaContextToDownloadJobs(genericContext)
    const request: StartDownloadRequest = {
      type: 'START_MEDIA_DOWNLOAD',
      context: genericContext,
      jobs,
      requestedMode: 'chrome',
    }

    console.info('[Reddit Media Downloader dry run]', genericContext)
    console.table(
      jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        mode: job.mode ?? 'dry-run',
      }))
    )

    return downloadClient(request)
      .catch(error => ({
        type: 'START_MEDIA_DOWNLOAD_RESULT' as const,
        mode: 'dry-run' as const,
        realDownloadExecuted: false,
        results: [],
        warnings: [error instanceof Error ? error.message : String(error)],
      }))
    })
}

async function completeRedditGalleryImages(
  postElement: Element,
  context: GenericMediaPostContext
): Promise<GenericMediaPostContext> {
  if (!isGalleryPost(postElement)) return context

  const jsonUrl = redditJsonUrl(context)
  const fetchJson = globalThis.fetch
  if (!jsonUrl || !fetchJson) {
    return addWarning(context, 'reddit_gallery_metadata_unavailable')
  }

  try {
    const response = await fetchJson(jsonUrl, { credentials: 'include' })
    if (!response.ok) {
      return addWarning(context, 'reddit_gallery_metadata_fetch_failed')
    }

    const galleryMedia = extractGalleryMedia(await response.json(), context.postId)
    const currentImageCount = context.media.filter(item => item.type === 'image').length
    if (galleryMedia.length === 0) {
      return addWarning(context, 'reddit_gallery_metadata_unavailable')
    }
    if (galleryMedia.length <= currentImageCount) return context

    return {
      ...context,
      media: [
        ...galleryMedia,
        ...context.media.filter(item => item.type !== 'image'),
      ],
    }
  } catch {
    return addWarning(context, 'reddit_gallery_metadata_fetch_failed')
  }
}

function isGalleryPost(postElement: Element): boolean {
  return Boolean(
    postElement.querySelector('shreddit-gallery, gallery-carousel') ||
      postElement.textContent?.match(/\bItem\s+\d+\s+of\s+\d+\b/i)
  )
}

function redditJsonUrl(context: GenericMediaPostContext): string | null {
  const href =
    context.permalink ?? `https://www.reddit.com/comments/${context.postId}/`
  try {
    const url = new URL(
      href,
      globalThis.location?.href ?? 'https://www.reddit.com/'
    )
    url.hash = ''
    url.search = ''
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/.json`
    url.searchParams.set('raw_json', '1')
    return url.href
  } catch {
    return null
  }
}

function extractGalleryMedia(
  json: unknown,
  postId: string
): GenericMediaPostContext['media'] {
  const post = findPostJson(json, postId)
  const items = post?.gallery_data?.items
  const metadata = post?.media_metadata
  if (!items || !metadata) return []

  return items
    .map((item, index) => {
      const id = item.media_id ?? item.id
      const url = id ? normalizeRedditMediaUrl(metadata[id]?.s?.u ?? '') : null
      if (!url || classifyRedditMediaUrl(url) !== 'image') return null
      return {
        type: 'image' as const,
        url,
        index,
        source: getRedditMediaSource(url),
        quality: getRedditMediaQuality(url),
      }
    })
    .filter(item => item !== null)
}

function findPostJson(json: unknown, postId: string): RedditPostJson | null {
  const listings = Array.isArray(json) ? json : [json]
  for (const listing of listings) {
    const children = readRecord(readRecord(listing).data).children
    if (!Array.isArray(children)) continue
    for (const child of children) {
      const data = readRecord(readRecord(child).data)
      if (data.id === postId || data.name === `t3_${postId}`) {
        return data as RedditPostJson
      }
    }
  }

  return null
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

function addWarning(
  context: GenericMediaPostContext,
  warning: string
): GenericMediaPostContext {
  return {
    ...context,
    warnings: [...(context.warnings ?? []), warning],
  }
}

type RedditPostJson = {
  gallery_data?: {
    items?: Array<{ media_id?: string; id?: string }>
  }
  media_metadata?: Record<string, { s?: { u?: string } }>
}

function keepImageMediaOnly(
  context: GenericMediaPostContext
): GenericMediaPostContext {
  const media = context.media.filter(item => item.type === 'image')
  const skippedCount = context.media.length - media.length
  const warnings = [...(context.warnings ?? [])]

  if (skippedCount > 0) warnings.push('non_image_media_skipped')
  if (media.length === 0) warnings.push('no_downloadable_images')

  return {
    ...context,
    media,
    warnings,
  }
}

function sendStartDownloadRequest(
  request: StartDownloadRequest
): Promise<StartDownloadResponse> {
  const runtime = (globalThis as {
    chrome?: {
      runtime?: {
        sendMessage?: (
          message: StartDownloadRequest,
          callback?: (response: StartDownloadResponse) => void
        ) => void | Promise<StartDownloadResponse>
      }
    }
  }).chrome?.runtime

  if (!runtime?.sendMessage) {
    return Promise.resolve({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: ['runtime_message_unavailable'],
    })
  }

  return new Promise(resolve => {
    const maybePromise = runtime.sendMessage?.(request, resolve)
    if (maybePromise && 'then' in maybePromise) maybePromise.then(resolve)
  })
}
