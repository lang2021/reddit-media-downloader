import type {
  GenericDownloadJob,
  GenericMediaPostContext,
} from '../bridge/generic-media-types.ts'
import type { DownloadMode } from '../settings/download-settings.ts'

export interface StartDownloadRequest {
  type: 'START_MEDIA_DOWNLOAD'
  jobs: GenericDownloadJob[]
  context: GenericMediaPostContext
  requestedMode?: DownloadMode
}

export interface DownloadResultItem {
  filename: string
  url: string
  ok: boolean
  downloadId?: number
  gid?: string
  error?: string
}

export interface StartDownloadResponse {
  type: 'START_MEDIA_DOWNLOAD_RESULT'
  mode: DownloadMode
  realDownloadExecuted: boolean
  results: DownloadResultItem[]
  warnings?: string[]
}

export function isStartDownloadRequest(
  value: unknown
): value is StartDownloadRequest {
  if (!isRecord(value)) return false
  return (
    value.type === 'START_MEDIA_DOWNLOAD' &&
    Array.isArray(value.jobs) &&
    isRecord(value.context) &&
    typeof value.context.postId === 'string' &&
    Array.isArray(value.context.media)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
