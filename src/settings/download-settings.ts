export type DownloadMode = 'dry-run' | 'chrome' | 'aria2'

export interface DownloadSettings {
  mode: DownloadMode
  enableRealDownloads: boolean
  aria2?: {
    endpoint?: string
    secret?: string
  }
}

export const DOWNLOAD_SETTINGS_STORAGE_KEY = 'redditMediaDownloaderSettings'

export const DEFAULT_DOWNLOAD_SETTINGS: DownloadSettings = {
  mode: 'dry-run',
  enableRealDownloads: false,
}

type ChromeStorageArea = {
  get: (
    key: string,
    callback?: (items: Record<string, unknown>) => void
  ) => void | Promise<Record<string, unknown>>
}

export async function readDownloadSettings(
  storage: ChromeStorageArea | undefined = getChromeStorage()
): Promise<DownloadSettings> {
  if (!storage) return DEFAULT_DOWNLOAD_SETTINGS

  const items = await storageGet(storage, DOWNLOAD_SETTINGS_STORAGE_KEY)
  return normalizeDownloadSettings(items[DOWNLOAD_SETTINGS_STORAGE_KEY])
}

export function resolveDownloadMode(settings: DownloadSettings): DownloadMode {
  return settings.enableRealDownloads ? settings.mode : 'dry-run'
}

function getChromeStorage(): ChromeStorageArea | undefined {
  return (globalThis as { chrome?: { storage?: { local?: ChromeStorageArea } } })
    .chrome?.storage?.local
}

function storageGet(
  storage: ChromeStorageArea,
  key: string
): Promise<Record<string, unknown>> {
  return new Promise(resolve => {
    let settled = false
    const finish = (items: Record<string, unknown>) => {
      if (settled) return
      settled = true
      resolve(items)
    }
    const maybePromise = storage.get(key, finish)
    if (maybePromise && 'then' in maybePromise) maybePromise.then(finish)
  })
}

function normalizeDownloadSettings(value: unknown): DownloadSettings {
  if (!isRecord(value)) return DEFAULT_DOWNLOAD_SETTINGS

  const mode = isDownloadMode(value.mode) ? value.mode : 'dry-run'
  const aria2 = isRecord(value.aria2)
    ? {
        endpoint:
          typeof value.aria2.endpoint === 'string'
            ? value.aria2.endpoint
            : undefined,
        secret:
          typeof value.aria2.secret === 'string'
            ? value.aria2.secret
            : undefined,
      }
    : undefined

  return {
    mode,
    enableRealDownloads: value.enableRealDownloads === true,
    ...(aria2 ? { aria2 } : {}),
  }
}

function isDownloadMode(value: unknown): value is DownloadMode {
  return value === 'dry-run' || value === 'chrome' || value === 'aria2'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
