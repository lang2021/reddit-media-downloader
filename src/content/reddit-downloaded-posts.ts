export const REDDIT_DOWNLOADED_POSTS_STORAGE_KEY = 'redditMediaDownloadedPosts'

type ChromeStorageArea = {
  get: (
    key: string,
    callback?: (items: Record<string, unknown>) => void
  ) => void | Promise<Record<string, unknown>>
  set: (
    items: Record<string, unknown>,
    callback?: () => void
  ) => void | Promise<void>
}

type DownloadedPostStore = Record<string, true>

export async function hasDownloadedRedditPost(
  postId: string,
  storage: ChromeStorageArea | undefined = getChromeStorage()
): Promise<boolean> {
  if (!storage) return false
  const store = await readDownloadedPostStore(storage)
  return store[postId] === true
}

export async function markRedditPostDownloaded(
  postId: string,
  storage: ChromeStorageArea | undefined = getChromeStorage()
): Promise<void> {
  if (!storage) return
  const store = await readDownloadedPostStore(storage)
  if (store[postId]) return

  await storageSet(storage, {
    [REDDIT_DOWNLOADED_POSTS_STORAGE_KEY]: {
      ...store,
      [postId]: true,
    },
  })
}

function getChromeStorage(): ChromeStorageArea | undefined {
  return (globalThis as { chrome?: { storage?: { local?: ChromeStorageArea } } })
    .chrome?.storage?.local
}

async function readDownloadedPostStore(
  storage: ChromeStorageArea
): Promise<DownloadedPostStore> {
  const items = await storageGet(storage, REDDIT_DOWNLOADED_POSTS_STORAGE_KEY)
  const value = items[REDDIT_DOWNLOADED_POSTS_STORAGE_KEY]
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, true] => entry[1] === true
    )
  )
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

function storageSet(
  storage: ChromeStorageArea,
  items: Record<string, unknown>
): Promise<void> {
  return new Promise(resolve => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const maybePromise = storage.set(items, finish)
    if (maybePromise && 'then' in maybePromise) maybePromise.then(finish)
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
