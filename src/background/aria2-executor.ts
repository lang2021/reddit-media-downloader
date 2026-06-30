import type { GenericDownloadJob } from '../bridge/generic-media-types.ts'
import type { DownloadResultItem } from '../messages/download-messages.ts'
import type { DownloadSettings } from '../settings/download-settings.ts'

type FetchLike = typeof fetch

export async function executeAria2Downloads(
  jobs: GenericDownloadJob[],
  settings: DownloadSettings,
  fetchImpl: FetchLike = fetch
): Promise<DownloadResultItem[]> {
  const endpoint = settings.aria2?.endpoint
  if (!endpoint) return jobs.map(job => fail(job, 'aria2_endpoint_missing'))

  const results: DownloadResultItem[] = []
  for (const [index, job] of jobs.entries()) {
    if (!job.url || !job.filename) {
      results.push(fail(job, 'invalid_download_job'))
      continue
    }

    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(makeAria2Request(job, index, settings)),
      })
      const body = (await response.json()) as {
        result?: string
        error?: { message?: string }
      }
      results.push(
        response.ok && body.result
          ? { filename: job.filename, url: job.url, ok: true, gid: body.result }
          : fail(job, body.error?.message ?? 'aria2_download_failed')
      )
    } catch (error) {
      results.push(fail(job, errorMessage(error)))
    }
  }

  return results
}

function makeAria2Request(
  job: GenericDownloadJob,
  index: number,
  settings: DownloadSettings
) {
  const params: unknown[] = [[job.url], { out: job.filename }]
  if (settings.aria2?.secret) params.unshift(`token:${settings.aria2.secret}`)

  return {
    jsonrpc: '2.0',
    id: `reddit-media-${index + 1}`,
    method: 'aria2.addUri',
    params,
  }
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
