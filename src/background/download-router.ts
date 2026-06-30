import type { GenericDownloadJob } from '../bridge/generic-media-types.ts'
import {
  isStartDownloadRequest,
  type DownloadResultItem,
  type StartDownloadRequest,
  type StartDownloadResponse,
} from '../messages/download-messages.ts'
import {
  readDownloadSettings,
  resolveDownloadMode,
  type DownloadSettings,
} from '../settings/download-settings.ts'
import { executeAria2Downloads } from './aria2-executor.ts'
import { executeChromeDownloads } from './chrome-download-executor.ts'

type RouterDeps = {
  settings?: DownloadSettings
  readSettings?: () => Promise<DownloadSettings>
  chromeDownload?: (jobs: GenericDownloadJob[]) => Promise<DownloadResultItem[]>
  aria2Download?: (
    jobs: GenericDownloadJob[],
    settings: DownloadSettings
  ) => Promise<DownloadResultItem[]>
}

export async function handleDownloadMessage(
  message: unknown,
  deps: RouterDeps = {}
): Promise<StartDownloadResponse> {
  if (!isStartDownloadRequest(message)) {
    return response('dry-run', false, [], ['invalid_download_message'])
  }

  return handleStartDownloadRequest(message, deps)
}

export async function handleStartDownloadRequest(
  request: StartDownloadRequest,
  deps: RouterDeps = {}
): Promise<StartDownloadResponse> {
  const settings =
    deps.settings ?? (deps.readSettings ? await deps.readSettings() : await readDownloadSettings())
  const mode =
    request.requestedMode === 'chrome' ? 'chrome' : resolveDownloadMode(settings)
  const warnings = request.context.warnings ?? []

  if (mode === 'dry-run') {
    return response(
      mode,
      false,
      request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings
    )
  }

  if (request.jobs.length === 0) {
    return response(mode, false, [], warnings)
  }

  if (mode === 'chrome') {
    const results = await (deps.chromeDownload ?? executeChromeDownloads)(
      request.jobs
    )
    return response(mode, true, results, warnings)
  }

  if (!settings.aria2?.endpoint) {
    return response(mode, false, markFailed(request.jobs, 'aria2_endpoint_missing'), [
      ...warnings,
      'aria2_endpoint_missing',
    ])
  }

  const results = await (deps.aria2Download ?? executeAria2Downloads)(
    request.jobs,
    settings
  )
  return response(mode, true, results, warnings)
}

function response(
  mode: StartDownloadResponse['mode'],
  realDownloadExecuted: boolean,
  results: DownloadResultItem[],
  warnings: string[] = []
): StartDownloadResponse {
  return {
    type: 'START_MEDIA_DOWNLOAD_RESULT',
    mode,
    realDownloadExecuted,
    results,
    warnings,
  }
}

function markFailed(
  jobs: GenericDownloadJob[],
  error: string
): DownloadResultItem[] {
  return jobs.map(job => ({
    filename: job.filename,
    url: job.url,
    ok: false,
    error,
  }))
}
