import type { GenericDownloadJob } from '../bridge/generic-media-types.ts'
import type { DownloadResultItem } from '../messages/download-messages.ts'

type ChromeApi = {
  downloads?: {
    download: (
      options: {
        url: string
        filename: string
        conflictAction: 'uniquify'
        saveAs: false
      },
      callback?: (downloadId?: number) => void
    ) => void | Promise<number | undefined>
  }
  runtime?: {
    lastError?: { message?: string }
  }
}

export async function executeChromeDownloads(
  jobs: GenericDownloadJob[],
  chromeApi: ChromeApi | undefined = (globalThis as { chrome?: ChromeApi }).chrome
): Promise<DownloadResultItem[]> {
  if (!chromeApi?.downloads?.download) {
    return jobs.map(job => fail(job, 'chrome_downloads_unavailable'))
  }

  const results: DownloadResultItem[] = []
  for (const job of jobs) {
    if (!isValidJob(job)) {
      results.push(fail(job, 'invalid_download_job'))
      continue
    }

    try {
      const downloadId = await download(chromeApi, job)
      const lastError = chromeApi.runtime?.lastError?.message
      results.push(
        lastError || downloadId === undefined
          ? fail(job, lastError ?? 'chrome_download_failed')
          : { filename: job.filename, url: job.url, ok: true, downloadId }
      )
    } catch (error) {
      results.push(fail(job, errorMessage(error)))
    }
  }

  return results
}

function download(
  chromeApi: ChromeApi,
  job: GenericDownloadJob
): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const result = chromeApi.downloads?.download(
      {
        url: job.url,
        filename: job.filename,
        conflictAction: 'uniquify',
        saveAs: false,
      },
      resolve
    )
    if (result && 'then' in result) result.then(resolve, reject)
  })
}

function isValidJob(job: GenericDownloadJob): boolean {
  return Boolean(job.url && job.filename)
}

function fail(job: Partial<GenericDownloadJob>, error: string): DownloadResultItem {
  return {
    filename: job.filename ?? '',
    url: job.url ?? '',
    ok: false,
    error,
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
