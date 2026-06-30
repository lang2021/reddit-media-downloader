import assert from 'node:assert/strict'
import { executeAria2Downloads } from '../src/background/aria2-executor.ts'
import { executeChromeDownloads } from '../src/background/chrome-download-executor.ts'
import { handleDownloadMessage } from '../src/background/download-router.ts'
import type { GenericDownloadJob, GenericMediaPostContext } from '../src/bridge/generic-media-types.ts'
import type { StartDownloadRequest } from '../src/messages/download-messages.ts'
import {
  DEFAULT_DOWNLOAD_SETTINGS,
  readDownloadSettings,
  resolveDownloadMode,
} from '../src/settings/download-settings.ts'

const context: GenericMediaPostContext = {
  platform: 'reddit',
  postId: 'post1',
  media: [],
}

const job: GenericDownloadJob = {
  url: 'https://i.redd.it/post1.jpg',
  filename: 'reddit_post1.jpg',
}

const request: StartDownloadRequest = {
  type: 'START_MEDIA_DOWNLOAD',
  context,
  jobs: [job],
}

{
  assert.deepEqual(DEFAULT_DOWNLOAD_SETTINGS, {
    mode: 'dry-run',
    enableRealDownloads: false,
  })
  assert.equal(resolveDownloadMode(DEFAULT_DOWNLOAD_SETTINGS), 'dry-run')
}

{
  const response = await handleDownloadMessage(request, {
    settings: { mode: 'chrome', enableRealDownloads: false },
    chromeDownload: async () => {
      throw new Error('chrome should not run')
    },
  })

  assert.equal(response.mode, 'dry-run')
  assert.equal(response.realDownloadExecuted, false)
  assert.equal(response.results.length, 1)
}

{
  const response = await handleDownloadMessage(
    { ...request, requestedMode: 'chrome' },
    {
      settings: DEFAULT_DOWNLOAD_SETTINGS,
      chromeDownload: async jobs =>
        jobs.map(item => ({
          filename: item.filename,
          url: item.url,
          ok: true,
          downloadId: 9,
        })),
    }
  )

  assert.equal(response.mode, 'chrome')
  assert.equal(response.realDownloadExecuted, true)
  assert.equal(response.results[0].downloadId, 9)
}

{
  const response = await handleDownloadMessage(
    { ...request, jobs: [], requestedMode: 'chrome' },
    {
      settings: DEFAULT_DOWNLOAD_SETTINGS,
      chromeDownload: async () => {
        throw new Error('zero-job request should not run chrome downloads')
      },
    }
  )

  assert.equal(response.mode, 'chrome')
  assert.equal(response.realDownloadExecuted, false)
  assert.equal(response.results.length, 0)
}

{
  const response = await handleDownloadMessage(request, {
    settings: { mode: 'aria2', enableRealDownloads: true },
  })

  assert.equal(response.mode, 'aria2')
  assert.equal(response.realDownloadExecuted, false)
  assert.ok(response.warnings?.includes('aria2_endpoint_missing'))
  assert.equal(response.results[0].error, 'aria2_endpoint_missing')
}

{
  const response = await handleDownloadMessage(request, {
    settings: { mode: 'chrome', enableRealDownloads: true },
    chromeDownload: async jobs =>
      jobs.map(item => ({
        filename: item.filename,
        url: item.url,
        ok: true,
        downloadId: 7,
      })),
  })

  assert.equal(response.mode, 'chrome')
  assert.equal(response.realDownloadExecuted, true)
  assert.equal(response.results[0].downloadId, 7)
}

{
  const response = await handleDownloadMessage({ type: 'NOPE' })
  assert.equal(response.mode, 'dry-run')
  assert.equal(response.realDownloadExecuted, false)
  assert.ok(response.warnings?.includes('invalid_download_message'))
}

{
  const calls: unknown[] = []
  const chromeApi = {
    downloads: {
      download: (options: unknown, callback?: (downloadId?: number) => void) => {
        calls.push(options)
        callback?.(42)
      },
    },
    runtime: {},
  }

  const results = await executeChromeDownloads([job], chromeApi)
  assert.equal(calls.length, 1)
  assert.equal(results[0].ok, true)
  assert.equal(results[0].downloadId, 42)
}

{
  const chromeApi = {
    downloads: {
      download: (_options: unknown, callback?: (downloadId?: number) => void) => {
        callback?.(undefined)
      },
    },
    runtime: { lastError: { message: 'denied' } },
  }

  const results = await executeChromeDownloads([job], chromeApi)
  assert.equal(results[0].ok, false)
  assert.equal(results[0].error, 'denied')
}

{
  const calls: unknown[] = []
  const results = await executeChromeDownloads(
    [{ url: '', filename: 'bad.jpg' }],
    {
      downloads: {
        download: options => {
          calls.push(options)
        },
      },
      runtime: {},
    }
  )

  assert.equal(calls.length, 0)
  assert.equal(results[0].error, 'invalid_download_job')
}

{
  const calls: string[] = []
  const fetchImpl: typeof fetch = async (_url, init) => {
    calls.push(String(init?.body))
    return new Response(JSON.stringify({ result: 'gid123' }), { status: 200 })
  }

  const results = await executeAria2Downloads(
    [job],
    {
      mode: 'aria2',
      enableRealDownloads: true,
      aria2: { endpoint: 'http://localhost:6800/jsonrpc' },
    },
    fetchImpl
  )

  assert.equal(results[0].gid, 'gid123')
  assert.match(calls[0], /aria2\.addUri/)
}

{
  const logs: string[] = []
  const originalLog = console.log
  console.log = value => logs.push(String(value))
  try {
    const fetchImpl: typeof fetch = async (_url, init) =>
      new Response(String(init?.body), { status: 200 })

    await executeAria2Downloads(
      [job],
      {
        mode: 'aria2',
        enableRealDownloads: true,
        aria2: { endpoint: 'http://localhost:6800/jsonrpc', secret: 'secret1' },
      },
      fetchImpl
    )
  } finally {
    console.log = originalLog
  }

  assert.deepEqual(logs, [])
}

{
  const fetchImpl: typeof fetch = async () => {
    throw new Error('network down')
  }
  const results = await executeAria2Downloads(
    [job],
    {
      mode: 'aria2',
      enableRealDownloads: true,
      aria2: { endpoint: 'http://localhost:6800/jsonrpc' },
    },
    fetchImpl
  )

  assert.equal(results[0].ok, false)
  assert.equal(results[0].error, 'network down')
}

{
  const settings = await readDownloadSettings({
    get: (_key, callback) => callback?.({}),
  })
  assert.deepEqual(settings, DEFAULT_DOWNLOAD_SETTINGS)
}

console.log('download execution gate checks passed')
