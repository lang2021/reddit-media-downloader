import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import type {
  StartDownloadRequest,
  StartDownloadResponse,
} from '../src/messages/download-messages.ts'
import {
  applyRedditDownloadButtonState,
  hasRedditDryRunButton,
  injectRedditDryRunButton,
} from '../src/content/reddit-injected-button.ts'
import {
  hasDownloadedRedditPost,
  markRedditPostDownloaded,
  REDDIT_DOWNLOADED_POSTS_STORAGE_KEY,
} from '../src/content/reddit-downloaded-posts.ts'
import {
  RedditDryRunUIController,
  runRedditDryRunForPost,
} from '../src/content/reddit-ui-controller.ts'
import { findRedditPostElements } from '../src/reddit/reddit-post-detector.ts'

const fixtureDir = 'tests/fixtures/reddit'
type FakeStorage = {
  data: Record<string, unknown>
  get: (
    key: string,
    callback?: (items: Record<string, unknown>) => void
  ) => void
  set: (items: Record<string, unknown>, callback?: () => void) => void
}

function loadFixture(name: string): Document {
  const html = readFileSync(join(fixtureDir, name), 'utf8')
  const dom = new JSDOM(html, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver
  return dom.window.document
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function makeFakeStorage(data: Record<string, unknown> = {}): FakeStorage {
  return {
    data,
    get(key, callback) {
      callback?.({ [key]: this.data[key] })
    },
    set(items, callback) {
      Object.assign(this.data, items)
      callback?.()
    },
  }
}

function installFakeChromeStorage(storage: FakeStorage): () => void {
  const originalChrome = (globalThis as { chrome?: unknown }).chrome
  ;(globalThis as { chrome?: unknown }).chrome = {
    storage: { local: storage },
  }
  return () => {
    ;(globalThis as { chrome?: unknown }).chrome = originalChrome
  }
}

function firstPost(name: string): Element {
  const document = loadFixture(name)
  const post = findRedditPostElements(document)[0]
  assert.ok(post, `${name} should contain a Reddit post candidate`)
  return post
}

async function withQuietConsole(callback: () => void | Promise<void>): Promise<void> {
  const info = console.info
  const table = console.table
  console.info = () => undefined
  console.table = () => undefined
  try {
    await callback()
  } finally {
    console.info = info
    console.table = table
  }
}

async function clickFirstRedditDownloadButton(document: Document): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-reddit-media-dry-run-button="true"]'
  )
  assert.ok(button)
  await withQuietConsole(async () => {
    button.click()
    await wait(0)
  })
}

function makeGalleryJson(postId: string, urls: string[]): unknown {
  const media_metadata: Record<string, { s: { u: string } }> = {}
  const items = urls.map((url, index) => {
    const media_id = `${postId}_${index + 1}`
    media_metadata[media_id] = { s: { u: url } }
    return { media_id }
  })

  return [
    {
      data: {
        children: [
          {
            data: {
              id: postId,
              name: `t3_${postId}`,
              gallery_data: { items },
              media_metadata,
            },
          },
        ],
      },
    },
  ]
}

{
  const storage = makeFakeStorage()
  assert.equal(await hasDownloadedRedditPost('stored_post', storage), false)
  await markRedditPostDownloaded('stored_post', storage)
  assert.equal(await hasDownloadedRedditPost('stored_post', storage), true)
  assert.deepEqual(storage.data, {
    [REDDIT_DOWNLOADED_POSTS_STORAGE_KEY]: { stored_post: true },
  })
}

{
  const post = firstPost('new-image-post.html')
  const button = injectRedditDryRunButton(post, () => undefined)

  assert.ok(button)
  assert.equal(hasRedditDryRunButton(post), true)
  assert.equal(button?.textContent, '')
  assert.equal(button?.title, 'Download Reddit images / 下载 Reddit 图片')
  assert.equal(button?.getAttribute('aria-label'), 'Download Reddit images')
  assert.equal(button?.querySelector('svg')?.getAttribute('aria-hidden'), 'true')
  assert.equal(
    button?.querySelector('path')?.getAttribute('fill'),
    'currentColor'
  )
  assert.equal(button?.parentElement, post)
  assert.equal(button?.style.position, 'absolute')
  assert.equal(button?.style.right, '12px')
  assert.equal(button?.style.bottom, '12px')
  assert.equal(button?.style.zIndex, '2147483646')
  assert.equal(button?.style.display, 'inline-flex')
  assert.equal(button?.style.background, 'rgb(184, 248, 197)')
  assert.equal(button?.style.color, 'rgb(15, 61, 30)')
  assert.equal(button?.style.borderRadius, '999px')
  assert.equal(button?.style.width, '32px')
  assert.equal(button?.style.minWidth, '32px')

  assert.ok(button)
  applyRedditDownloadButtonState(button, 'downloaded')
  assert.equal(button.title, 'Downloaded Reddit images / 已下载 Reddit 图片')
  assert.equal(button.getAttribute('aria-label'), 'Reddit images downloaded')
  assert.equal(button.style.background, 'rgb(255, 240, 184)')
  assert.equal(button.style.color, 'rgb(122, 82, 0)')
  assert.match(button.querySelector('path')?.getAttribute('d') ?? '', /^M17\.5/)
  applyRedditDownloadButtonState(button, 'default')
  assert.equal(button.title, 'Download Reddit images / 下载 Reddit 图片')
  assert.equal(button.getAttribute('aria-label'), 'Download Reddit images')
  assert.equal(button.style.background, 'rgb(184, 248, 197)')
}

{
  const dom = new JSDOM(`
    <article data-post-id="t3_shell01">
      <shreddit-post
        id="t3_shell01"
        post-title="Shell layout post"
        author="shell_author"
        subreddit-name="pics"
        permalink="/r/pics/comments/shell01/shell_layout_post/"
      >
        <div slot="post-media-container">
          <img src="https://i.redd.it/shell01.jpg" alt="Shell layout post" />
        </div>
        <div aria-label="Actions available for this post">
          <div>
            <button aria-label="Upvote">Upvote</button>
            <span>9</span>
            <button aria-label="Downvote">Downvote</button>
          </div>
          <a href="/r/pics/comments/shell01/shell_layout_post/">3 Go to comments</a>
          <button type="button" aria-label="Share">Share</button>
        </div>
      </shreddit-post>
    </article>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const post = findRedditPostElements(dom.window.document)[0]
  assert.ok(post)

  const button = injectRedditDryRunButton(post, () => undefined)
  const host = post.querySelector('shreddit-post') ?? post
  const shell = host.querySelector('[data-reddit-media-dry-run-action-shell="true"]')
  const actionRow = host.querySelector('[aria-label="Actions available for this post"]')

  assert.ok(button)
  assert.ok(shell)
  assert.ok(actionRow)
  assert.equal(button?.style.position, 'static')
  assert.equal(button?.parentElement, shell)
  assert.equal(actionRow?.parentElement, shell)
  assert.equal(shell?.children.length, 2)
  assert.equal(shell?.firstElementChild, actionRow)
  assert.equal(shell?.lastElementChild, button)
  assert.equal((actionRow as HTMLElement).style.flex, '1 1 auto')
}

{
  const document = loadFixture('real-captured/real-new-gallery-lazy-buttons.html')
  const post = findRedditPostElements(document)[0]
  assert.ok(post)

  const button = injectRedditDryRunButton(post, () => undefined)
  const host = post.querySelector('shreddit-post') ?? post

  assert.ok(button)
  assert.equal(button?.parentElement, host)
  assert.equal(button?.style.position, 'absolute')
  assert.equal(button?.style.right, '12px')
  assert.equal(button?.style.bottom, '12px')
  assert.equal(button?.style.zIndex, '2147483646')
  assert.equal(button?.style.borderRadius, '999px')
  assert.equal(button?.style.height, '32px')
  assert.equal(button?.style.width, '32px')
}

{
  const dom = new JSDOM(`
    <article data-post-id="t3_shell02">
      <shreddit-post
        id="t3_shell02"
        post-title="Shell idempotent post"
        author="shell_idempotent"
        subreddit-name="pics"
        permalink="/r/pics/comments/shell02/shell_idempotent_post/"
      >
        <div slot="post-media-container">
          <img src="https://i.redd.it/shell02.jpg" alt="Shell idempotent post" />
        </div>
        <div aria-label="Actions available for this post">
          <a href="/r/pics/comments/shell02/shell_idempotent_post/">7 Go to comments</a>
          <button type="button" aria-label="Share">Share</button>
        </div>
      </shreddit-post>
    </article>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const post = findRedditPostElements(dom.window.document)[0]
  assert.ok(post)
  const first = injectRedditDryRunButton(post, () => undefined)
  const second = injectRedditDryRunButton(post, () => undefined)
  const host = post.querySelector('shreddit-post') ?? post

  assert.equal(first, second)
  assert.equal(
    host.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length,
    1
  )
  assert.equal(
    host.querySelectorAll('[data-reddit-media-dry-run-action-shell="true"]').length,
    1
  )
}

{
  const post = firstPost('new-image-post.html')
  const requests: StartDownloadRequest[] = []
  const button = injectRedditDryRunButton(post, () =>
    void runRedditDryRunForPost(post, async request => {
      requests.push(request)
      return {
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'dry-run',
        realDownloadExecuted: false,
        results: request.jobs.map(job => ({
          filename: job.filename,
          url: job.url,
          ok: true,
        })),
        warnings: [],
      }
    })
  )

  await withQuietConsole(async () => {
    button?.click()
    await Promise.resolve()
    await Promise.resolve()
  })

  assert.equal(requests.length, 1)
  assert.equal(requests[0].requestedMode, 'chrome')
  assert.equal(requests[0].context.postId, 'nimg123')
  assert.equal(
    requests[0].jobs[0].filename,
    'reddit_media_harvest/reddit_r_pics_alice_nimg123_1.jpg'
  )
  assert.equal(requests[0].jobs[0].metadata?.mediaType, 'image')
  assert.equal(document.getElementById('reddit-media-dry-run-panel'), null)
}

{
  const document = loadFixture('new-image-post.html')
  const storage = makeFakeStorage({
    [REDDIT_DOWNLOADED_POSTS_STORAGE_KEY]: { nimg123: true },
  })
  const restoreChrome = installFakeChromeStorage(storage)
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'chrome',
      realDownloadExecuted: true,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  try {
    controller.start()
    await wait(0)

    const button = document.querySelector<HTMLButtonElement>(
      '[data-reddit-media-dry-run-button="true"]'
    )
    assert.ok(button)
    assert.equal(button.title, 'Downloaded Reddit images / 已下载 Reddit 图片')
    assert.equal(button.getAttribute('aria-label'), 'Reddit images downloaded')
    assert.match(button.querySelector('path')?.getAttribute('d') ?? '', /^M17\.5/)
  } finally {
    controller.stop()
    restoreChrome()
  }
}

{
  const document = loadFixture('new-image-post.html')
  const storage = makeFakeStorage()
  const restoreChrome = installFakeChromeStorage(storage)
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'chrome',
      realDownloadExecuted: true,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  try {
    controller.start()
    await clickFirstRedditDownloadButton(document)

    assert.deepEqual(storage.data, {
      [REDDIT_DOWNLOADED_POSTS_STORAGE_KEY]: { nimg123: true },
    })
    const button = document.querySelector<HTMLButtonElement>(
      '[data-reddit-media-dry-run-button="true"]'
    )
    assert.equal(button?.title, 'Downloaded Reddit images / 已下载 Reddit 图片')
  } finally {
    controller.stop()
    restoreChrome()
  }
}

for (const responseForRequest of [
  (request: StartDownloadRequest): StartDownloadResponse => ({
    type: 'START_MEDIA_DOWNLOAD_RESULT',
    mode: 'dry-run',
    realDownloadExecuted: false,
    results: request.jobs.map(job => ({
      filename: job.filename,
      url: job.url,
      ok: true,
    })),
    warnings: [],
  }),
  (): StartDownloadResponse => ({
    type: 'START_MEDIA_DOWNLOAD_RESULT',
    mode: 'chrome',
    realDownloadExecuted: true,
    results: [],
    warnings: [],
  }),
  (request: StartDownloadRequest): StartDownloadResponse => ({
    type: 'START_MEDIA_DOWNLOAD_RESULT',
    mode: 'chrome',
    realDownloadExecuted: true,
    results: request.jobs.map((job, index) => ({
      filename: job.filename,
      url: job.url,
      ok: index !== 0,
      ...(index === 0 ? { error: 'download_failed' } : {}),
    })),
    warnings: [],
  }),
  (request: StartDownloadRequest): StartDownloadResponse => ({
    type: 'START_MEDIA_DOWNLOAD_RESULT',
    mode: 'chrome',
    realDownloadExecuted: false,
    results: request.jobs.map(job => ({
      filename: job.filename,
      url: job.url,
      ok: false,
      error: 'download_failed',
    })),
    warnings: [],
  }),
]) {
  const document = loadFixture('new-image-post.html')
  const storage = makeFakeStorage()
  const restoreChrome = installFakeChromeStorage(storage)
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => responseForRequest(request),
  })

  try {
    controller.start()
    await clickFirstRedditDownloadButton(document)

    assert.deepEqual(storage.data, {})
    const button = document.querySelector<HTMLButtonElement>(
      '[data-reddit-media-dry-run-button="true"]'
    )
    assert.equal(button?.title, 'Download Reddit images / 下载 Reddit 图片')
  } finally {
    controller.stop()
    restoreChrome()
  }
}

{
  const document = loadFixture('new-image-post.html')
  const storage = makeFakeStorage()
  const restoreChrome = installFakeChromeStorage(storage)
  const requests: StartDownloadRequest[] = []
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => {
      requests.push(request)
      return {
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'dry-run',
        realDownloadExecuted: false,
        results: request.jobs.map(job => ({
          filename: job.filename,
          url: job.url,
          ok: true,
        })),
        warnings: [],
      }
    },
  })

  try {
    controller.start()
    await Promise.resolve()
    await markRedditPostDownloaded('nimg123', storage)
    const post = findRedditPostElements(document)[0]
    assert.ok(post)
    post.append(document.createElement('span'))
    await wait(200)
    await clickFirstRedditDownloadButton(document)

    const buttons = document.querySelectorAll('[data-reddit-media-dry-run-button="true"]')
    assert.equal(buttons.length, 1)
    assert.equal(requests.length, 1)
    assert.equal(
      (buttons[0] as HTMLButtonElement).title,
      'Downloaded Reddit images / 已下载 Reddit 图片'
    )
  } finally {
    controller.stop()
    restoreChrome()
  }
}

{
  const dom = new JSDOM(`
    <shreddit-post
      id="t3_singlepreview"
      post-title="Single preview and original"
      author="u/realposter"
      subreddit-name="r/pics"
      permalink="/r/pics/comments/singlepreview/single_preview_and_original/"
    >
      <a href="/r/pics/comments/singlepreview/single_preview_and_original/">Permalink</a>
      <img
        alt=""
        src="https://preview.redd.it/single-preview-v0-previewtoken.jpeg?width=640&amp;crop=smart&amp;auto=webp"
        srcset="https://preview.redd.it/single-preview-v0-previewtoken.jpeg?width=320&amp;crop=smart&amp;auto=webp 320w, https://preview.redd.it/single-preview-v0-previewtoken.jpeg?width=1080&amp;crop=smart&amp;auto=webp 1080w"
      />
      <img
        alt="r/pics - Single preview and original"
        src="https://i.redd.it/originaltoken.jpeg"
      />
    </shreddit-post>
  `, { url: 'https://www.reddit.com/r/pics/comments/singlepreview/single_preview_and_original/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement

  const post = dom.window.document.querySelector('shreddit-post')
  const requests: StartDownloadRequest[] = []
  assert.ok(post)

  await withQuietConsole(async () => {
    await runRedditDryRunForPost(post, async request => {
      requests.push(request)
      return {
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'chrome',
        realDownloadExecuted: true,
        results: request.jobs.map(job => ({
          filename: job.filename,
          url: job.url,
          ok: true,
        })),
        warnings: request.context.warnings,
      }
    })
  })

  assert.equal(requests.length, 1)
  assert.deepEqual(
    requests[0].jobs.map(job => job.url),
    ['https://i.redd.it/originaltoken.jpeg']
  )
}

{
  const dom = new JSDOM(`
    <div class="feed-wrapper">
      <shreddit-post
        id="t3_wrapa"
        post-title="Wrapper A"
        author="alice"
        subreddit-name="pics"
        permalink="/r/pics/comments/wrapa/wrapper_a/"
      >
        <a href="/r/pics/comments/wrapa/wrapper_a/">Wrapper A</a>
        <img src="https://i.redd.it/wrapa.jpg" />
      </shreddit-post>
      <shreddit-post
        id="t3_wrapb"
        post-title="Wrapper B"
        author="bob"
        subreddit-name="pics"
        permalink="/r/pics/comments/wrapb/wrapper_b/"
      >
        <a href="/r/pics/comments/wrapb/wrapper_b/">Wrapper B</a>
        <img src="https://i.redd.it/wrapb.jpg" />
      </shreddit-post>
    </div>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const requests: StartDownloadRequest[] = []
  const controller = new RedditDryRunUIController({
    root: dom.window.document.body,
    downloadClient: async request => {
      requests.push(request)
      return {
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'chrome',
        realDownloadExecuted: true,
        results: request.jobs.map(job => ({
          filename: job.filename,
          url: job.url,
          ok: true,
          downloadId: 1,
        })),
        warnings: [],
      }
    },
  })

  controller.start()
  const secondButton = dom.window.document.querySelector<HTMLButtonElement>(
    '#t3_wrapb [data-reddit-media-dry-run-button="true"]'
  )
  assert.ok(secondButton)

  await withQuietConsole(async () => {
    secondButton.click()
    await Promise.resolve()
    await Promise.resolve()
  })

  controller.stop()
  assert.equal(
    dom.window.document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length,
    2
  )
  assert.equal(requests.length, 1)
  assert.equal(requests[0].context.postId, 'wrapb')
  assert.deepEqual(
    requests[0].jobs.map(job => job.url),
    ['https://i.redd.it/wrapb.jpg']
  )
}

{
  const dom = new JSDOM(`
    <main>
      <shreddit-post
        id="t3_gallerya"
        post-title="Gallery A"
        author="alice"
        subreddit-name="pics"
        permalink="/r/pics/comments/gallerya/gallery_a/"
      >
        <gallery-carousel>
          <img src="https://i.redd.it/gallery-a-1.png" />
        </gallery-carousel>
      </shreddit-post>
      <shreddit-post
        id="t3_galleryb"
        post-title="Gallery B"
        author="bob"
        subreddit-name="pics"
        permalink="/r/pics/comments/galleryb/gallery_b/"
      >
        <gallery-carousel>
          <img src="https://i.redd.it/gallery-b-dom-1.png" />
          <img src="https://i.redd.it/gallery-b-dom-2.png" />
          <img src="https://i.redd.it/gallery-b-dom-3.png" />
          <img src="https://i.redd.it/gallery-b-dom-4.png" />
          <span>Item 1 of 15</span>
        </gallery-carousel>
      </shreddit-post>
    </main>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const originalFetch = globalThis.fetch
  const fetchedUrls: string[] = []
  globalThis.fetch = (async input => {
    fetchedUrls.push(String(input))
    return {
      ok: true,
      json: async () =>
        makeGalleryJson(
          'galleryb',
          Array.from(
            { length: 15 },
            (_value, index) => `https://i.redd.it/gallery-b-${index + 1}.png`
          )
        ),
    } as unknown as Response
  }) as typeof fetch

  try {
    const requests: StartDownloadRequest[] = []
    const post = dom.window.document.querySelector('#t3_galleryb')
    assert.ok(post)

    await withQuietConsole(async () => {
      await runRedditDryRunForPost(post, async request => {
        requests.push(request)
        return {
          type: 'START_MEDIA_DOWNLOAD_RESULT',
          mode: 'chrome',
          realDownloadExecuted: true,
          results: request.jobs.map(job => ({
            filename: job.filename,
            url: job.url,
            ok: true,
          })),
          warnings: request.context.warnings,
        }
      })
    })

    assert.equal(fetchedUrls.length, 1)
    assert.ok(fetchedUrls[0].includes('/comments/galleryb/gallery_b/.json'))
    assert.equal(requests.length, 1)
    assert.equal(requests[0].context.postId, 'galleryb')
    assert.equal(requests[0].jobs.length, 15)
    assert.equal(requests[0].jobs[0].url, 'https://i.redd.it/gallery-b-1.png')
    assert.equal(requests[0].jobs[14].url, 'https://i.redd.it/gallery-b-15.png')
  } finally {
    globalThis.fetch = originalFetch
  }
}

{
  const dom = new JSDOM(`
    <shreddit-post
      id="t3_dupegal"
      post-title="Duplicate gallery"
      author="dupe_author"
      subreddit-name="pics"
      permalink="/r/pics/comments/dupegal/duplicate_gallery/"
    >
      <gallery-carousel>
        <img src="https://i.redd.it/dupe-gallery.png" />
        <span>Item 1 of 2</span>
      </gallery-carousel>
    </shreddit-post>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () =>
      makeGalleryJson('dupegal', [
        'https://i.redd.it/dupe-gallery.png',
        'https://i.redd.it/dupe-gallery.png?utm_source=share',
      ]),
  }) as unknown as Response) as typeof fetch

  try {
    const requests: StartDownloadRequest[] = []
    const post = dom.window.document.querySelector('#t3_dupegal')
    assert.ok(post)

    await withQuietConsole(async () => {
      await runRedditDryRunForPost(post, async request => {
        requests.push(request)
        return {
          type: 'START_MEDIA_DOWNLOAD_RESULT',
          mode: 'chrome',
          realDownloadExecuted: true,
          results: request.jobs.map(job => ({
            filename: job.filename,
            url: job.url,
            ok: true,
          })),
          warnings: request.context.warnings,
        }
      })
    })

    assert.equal(requests.length, 1)
    assert.equal(requests[0].jobs.length, 1)
    assert.equal(requests[0].jobs[0].url, 'https://i.redd.it/dupe-gallery.png')
  } finally {
    globalThis.fetch = originalFetch
  }
}

{
  const dom = new JSDOM(`
    <shreddit-post
      id="t3_failgal"
      post-title="Fail gallery"
      author="fail_author"
      subreddit-name="pics"
      permalink="/r/pics/comments/failgal/fail_gallery/"
    >
      <gallery-carousel>
        <img src="https://i.redd.it/failgal-1.png" />
        <img src="https://i.redd.it/failgal-2.png" />
        <img src="https://i.redd.it/failgal-3.png" />
        <img src="https://i.redd.it/failgal-4.png" />
      </gallery-carousel>
    </shreddit-post>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    throw new Error('network down')
  }) as typeof fetch

  try {
    const post = dom.window.document.querySelector('#t3_failgal')
    const requests: StartDownloadRequest[] = []
    assert.ok(post)

    await withQuietConsole(async () => {
      await runRedditDryRunForPost(post, async request => {
        requests.push(request)
        return {
          type: 'START_MEDIA_DOWNLOAD_RESULT',
          mode: 'chrome',
          realDownloadExecuted: true,
          results: request.jobs.map(job => ({
            filename: job.filename,
            url: job.url,
            ok: true,
          })),
          warnings: request.context.warnings,
        }
      })
    })

    assert.equal(requests[0].jobs.length, 4)
    assert.ok(
      requests[0].context.warnings?.includes(
        'reddit_gallery_metadata_fetch_failed'
      )
    )
  } finally {
    globalThis.fetch = originalFetch
  }
}

{
  const dom = new JSDOM(`
    <shreddit-post
      id="t3_nometa"
      post-title="No metadata gallery"
      author="nometa_author"
      subreddit-name="pics"
      permalink="/r/pics/comments/nometa/no_metadata_gallery/"
    >
      <gallery-carousel>
        <img src="https://i.redd.it/nometa-1.png" />
        <img src="https://i.redd.it/nometa-2.png" />
      </gallery-carousel>
    </shreddit-post>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () =>
    ({
    ok: true,
    json: async () => [{ data: { children: [{ data: { id: 'otherpost' } }] } }],
  }) as unknown as Response) as typeof fetch

  try {
    const post = dom.window.document.querySelector('#t3_nometa')
    const requests: StartDownloadRequest[] = []
    assert.ok(post)

    await withQuietConsole(async () => {
      await runRedditDryRunForPost(post, async request => {
        requests.push(request)
        return {
          type: 'START_MEDIA_DOWNLOAD_RESULT',
          mode: 'chrome',
          realDownloadExecuted: true,
          results: request.jobs.map(job => ({
            filename: job.filename,
            url: job.url,
            ok: true,
          })),
          warnings: request.context.warnings,
        }
      })
    })

    assert.equal(requests[0].jobs.length, 2)
    assert.ok(
      requests[0].context.warnings?.includes(
        'reddit_gallery_metadata_unavailable'
      )
    )
  } finally {
    globalThis.fetch = originalFetch
  }
}

{
  const post = firstPost('non-media-post.html')
  const requests: StartDownloadRequest[] = []

  const response = await runRedditDryRunForPost(post, async request => {
    requests.push(request)
    throw new Error('should not send non-media request')
  })

  assert.equal(response, null)
  assert.equal(requests.length, 0)
}

{
  const post = firstPost('unsupported-video-post.html')
  const requests: StartDownloadRequest[] = []

  await withQuietConsole(async () => {
    const response = await runRedditDryRunForPost(post, async request => {
      requests.push(request)
      return {
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'dry-run',
        realDownloadExecuted: false,
        results: [],
        warnings: request.context.warnings,
      }
    })
    assert.equal(response?.results.length, 0)
  })

  assert.equal(requests.length, 1)
  assert.equal(requests[0].requestedMode, 'chrome')
  assert.equal(requests[0].jobs.length, 0)
  assert.ok(
    requests[0].context.warnings?.includes(
      'video_requires_manifest_or_audio_merge'
    )
  )
  assert.ok(requests[0].context.warnings?.includes('non_image_media_skipped'))
  assert.ok(requests[0].context.warnings?.includes('no_downloadable_images'))
}

{
  const post = firstPost('new-video-post.html')
  const requests: StartDownloadRequest[] = []

  await withQuietConsole(async () => {
    const response = await runRedditDryRunForPost(post, async request => {
      requests.push(request)
      return {
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'chrome',
        realDownloadExecuted: false,
        results: [],
        warnings: request.context.warnings,
      }
    })
    assert.equal(response?.results.length, 0)
  })

  assert.equal(requests.length, 1)
  assert.equal(requests[0].requestedMode, 'chrome')
  assert.equal(requests[0].context.media.length, 0)
  assert.equal(requests[0].jobs.length, 0)
  assert.ok(requests[0].context.warnings?.includes('non_image_media_skipped'))
  assert.ok(requests[0].context.warnings?.includes('no_downloadable_images'))
}

{
  const post = firstPost('new-image-post.html')
  const originalChrome = (globalThis as { chrome?: unknown }).chrome
  ;(globalThis as { chrome?: unknown }).chrome = {
    downloads: {
      download: () => {
        throw new Error('real downloads must not be called in dry run')
      },
    },
  }

  try {
    await withQuietConsole(async () => {
      const response = await runRedditDryRunForPost(post, async request => ({
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'dry-run',
        realDownloadExecuted: false,
        results: request.jobs.map(job => ({
          filename: job.filename,
          url: job.url,
          ok: true,
        })),
        warnings: [],
      }))
      assert.equal(response?.results.length, 1)
      assert.equal(response?.realDownloadExecuted, false)
    })
  } finally {
    ;(globalThis as { chrome?: unknown }).chrome = originalChrome
  }
}

{
  const document = loadFixture('new-gallery-post.html')
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  assert.doesNotThrow(() => controller.start())
  assert.doesNotThrow(() => controller.stop())
  assert.equal(
    document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length,
    1
  )
}

{
  const document = loadFixture('real-captured/real-new-gallery-lazy-buttons.html')
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  controller.start()
  controller.stop()

  assert.equal(
    document.querySelectorAll('shreddit-post [data-reddit-media-dry-run-button="true"]').length,
    2
  )
  assert.equal(
    document.querySelectorAll('shreddit-ad-post [data-reddit-media-dry-run-button="true"]').length,
    0
  )
}

{
  const document = loadFixture('real-captured/real-new-gallery-lazy-buttons.html')
  const firstImage = document.querySelector('shreddit-post img')
  assert.ok(firstImage)

  const posts = findRedditPostElements(firstImage)
  assert.equal(posts.length, 1)
  assert.equal(posts[0].id, 't3_realgal01')
}

{
  const dom = new JSDOM(`
    <article class="w-full m-0" data-post-id="t3_lazy01">
      <shreddit-post
        id="t3_lazy01"
        post-title="Lazy media post"
        author="lazy_author"
        subreddit-name="pics"
        permalink="/r/pics/comments/lazy01/lazy_media_post/"
      >
        <span slot="credit-bar">u/lazy_author</span>
        <div slot="post-media-container"></div>
        <div aria-label="Actions available for this post"></div>
      </shreddit-post>
    </article>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const controller = new RedditDryRunUIController({
    root: dom.window.document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  controller.start()
  assert.equal(dom.window.document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length, 0)

  const image = dom.window.document.createElement('img')
  image.src = 'https://i.redd.it/lazy01.jpg'
  dom.window.document.querySelector('[slot="post-media-container"]')?.append(image)
  await wait(200)

  controller.stop()
  assert.equal(dom.window.document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length, 1)
  assert.equal(
    dom.window.document.querySelectorAll('article [data-reddit-media-dry-run-button="true"]').length,
    1
  )
  assert.equal(
    dom.window.document.querySelectorAll('[data-reddit-media-dry-run-action-shell="true"]').length,
    1
  )
}

{
  const document = loadFixture('new-image-post.html')
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  controller.start()
  const button = document.querySelector('[data-reddit-media-dry-run-button="true"]')
  assert.ok(button)
  button.remove()
  await wait(200)

  controller.stop()
  assert.equal(
    document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length,
    1
  )
}

{
  const dom = new JSDOM(`
    <article data-post-id="t3_fast01">
      <shreddit-post
        id="t3_fast01"
        post-title="Fast scan"
        author="fast_author"
        subreddit-name="pics"
        permalink="/r/pics/comments/fast01/fast_scan/"
      >
        <div slot="post-media-container"></div>
      </shreddit-post>
    </article>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const controller = new RedditDryRunUIController({
    root: dom.window.document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  controller.start()
  const post = dom.window.document.querySelector('#t3_fast01')
  assert.ok(post)

  const image = dom.window.document.createElement('img')
  image.src = 'https://i.redd.it/fast01.jpg'
  dom.window.document.querySelector('[slot="post-media-container"]')?.append(image)
  await wait(10)
  post.append(dom.window.document.createElement('span'))
  await wait(10)
  post.append(dom.window.document.createElement('span'))
  await wait(70)

  controller.stop()
  assert.equal(
    dom.window.document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length,
    1
  )
}

{
  const dom = new JSDOM(`
    <main>
      <article data-post-id="t3_lazy_a">
        <shreddit-post
          id="t3_lazy_a"
          post-title="Lazy A"
          author="lazy_a"
          subreddit-name="pics"
          permalink="/r/pics/comments/lazy_a/lazy_a/"
        >
          <div slot="post-media-container"></div>
        </shreddit-post>
      </article>
      <article data-post-id="t3_lazy_b">
        <shreddit-post
          id="t3_lazy_b"
          post-title="Lazy B"
          author="lazy_b"
          subreddit-name="pics"
          permalink="/r/pics/comments/lazy_b/lazy_b/"
        >
          <div slot="post-media-container"></div>
        </shreddit-post>
      </article>
    </main>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const controller = new RedditDryRunUIController({
    root: dom.window.document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  controller.start()
  const firstImage = dom.window.document.createElement('img')
  firstImage.src = 'https://i.redd.it/lazy-a.jpg'
  dom.window.document
    .querySelector('#t3_lazy_a [slot="post-media-container"]')
    ?.append(firstImage)
  await wait(0)

  const secondImage = dom.window.document.createElement('img')
  secondImage.src = 'https://i.redd.it/lazy-b.jpg'
  dom.window.document
    .querySelector('#t3_lazy_b [slot="post-media-container"]')
    ?.append(secondImage)
  await wait(200)

  controller.stop()
  assert.equal(
    dom.window.document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length,
    2
  )
}

{
  const dom = new JSDOM(`
    <main>
      <article data-post-id="t3_missed_a">
        <shreddit-post
          id="t3_missed_a"
          post-title="Missed A"
          author="missed_a"
          subreddit-name="pics"
          permalink="/r/pics/comments/missed_a/missed_a/"
        >
          <div slot="post-media-container"></div>
        </shreddit-post>
      </article>
      <article data-post-id="t3_unrelated_b">
        <shreddit-post
          id="t3_unrelated_b"
          post-title="Unrelated B"
          author="unrelated_b"
          subreddit-name="pics"
          permalink="/r/pics/comments/unrelated_b/unrelated_b/"
        >
          <div slot="post-media-container"></div>
        </shreddit-post>
      </article>
    </main>
  `, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement

  const realMutationObserver = globalThis.MutationObserver
  let triggerMutation:
    | ((mutations: Array<{ addedNodes: Node[]; target: Element }>) => void)
    | undefined

  class ManualMutationObserver {
    constructor(callback: MutationCallback) {
      triggerMutation = mutations =>
        callback(
          mutations as unknown as MutationRecord[],
          this as unknown as MutationObserver
        )
    }
    observe(): void {}
    disconnect(): void {}
  }

  globalThis.MutationObserver =
    ManualMutationObserver as unknown as typeof MutationObserver

  try {
    const controller = new RedditDryRunUIController({
      root: dom.window.document.body,
      downloadClient: async request => ({
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'dry-run',
        realDownloadExecuted: false,
        results: request.jobs.map(job => ({
          filename: job.filename,
          url: job.url,
          ok: true,
        })),
        warnings: [],
      }),
    })

    controller.start()

    const missedImage = dom.window.document.createElement('img')
    missedImage.src = 'https://i.redd.it/missed-a.jpg'
    dom.window.document
      .querySelector('#t3_missed_a [slot="post-media-container"]')
      ?.append(missedImage)

    const unrelatedSpan = dom.window.document.createElement('span')
    dom.window.document.querySelector('#t3_unrelated_b')?.append(unrelatedSpan)
    triggerMutation?.([
      {
        addedNodes: [unrelatedSpan],
        target: dom.window.document.querySelector('#t3_unrelated_b')!,
      },
    ])
    await wait(1100)

    controller.stop()
    assert.equal(
      dom.window.document.querySelectorAll('#t3_missed_a [data-reddit-media-dry-run-button="true"]').length,
      1
    )
  } finally {
    globalThis.MutationObserver = realMutationObserver
  }
}

{
  const document = loadFixture('new-image-post.html')
  const controller = new RedditDryRunUIController({
    root: document.body,
    downloadClient: async request => ({
      type: 'START_MEDIA_DOWNLOAD_RESULT',
      mode: 'dry-run',
      realDownloadExecuted: false,
      results: request.jobs.map(job => ({
        filename: job.filename,
        url: job.url,
        ok: true,
      })),
      warnings: [],
    }),
  })

  controller.start()
  const post = findRedditPostElements(document)[0]
  assert.ok(post)
  post.append(document.createElement('span'))
  post.append(document.createElement('span'))
  await wait(200)

  controller.stop()
  assert.equal(
    document.querySelectorAll('[data-reddit-media-dry-run-button="true"]').length,
    1
  )
}

console.log('reddit UI dry-run checks passed')
