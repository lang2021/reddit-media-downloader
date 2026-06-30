import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { DryRunMediaBridge } from '../src/bridge/DryRunMediaBridge.ts'
import { genericMediaContextToDownloadJobs } from '../src/bridge/generic-download-jobs.ts'
import { redditMediaContextToGenericMediaContext } from '../src/bridge/reddit-to-generic-media.ts'
import { extractRedditMediaFromPostElement } from '../src/reddit/reddit-media-extractor.ts'
import { findRedditPostElements } from '../src/reddit/reddit-post-detector.ts'

const fixturePaths = process.argv.slice(2)

if (fixturePaths.length === 0) {
  console.error('Usage: npm run probe:bridge -- tests/fixtures/reddit/new-image-post.html')
  process.exit(1)
}

for (const fixturePath of fixturePaths) {
  const absolutePath = resolve(fixturePath)
  const html = readFileSync(absolutePath, 'utf8')
  const dom = new JSDOM(html, { url: 'https://www.reddit.com/r/test/' })

  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.MutationObserver = dom.window.MutationObserver

  const bridge = new DryRunMediaBridge()
  const warnings = new Set<string>()
  const candidates = findRedditPostElements(dom.window.document)

  for (const post of candidates) {
    const redditContext = extractRedditMediaFromPostElement(post)
    if (!redditContext) continue

    const genericContext = redditMediaContextToGenericMediaContext(redditContext)
    const jobs = genericMediaContextToDownloadJobs(genericContext)

    bridge.receiveContext(genericContext)
    bridge.receiveDownloadJobs(jobs)
    genericContext.warnings?.forEach(warning => warnings.add(warning))
  }

  console.log(
    JSON.stringify(
      {
        fixture: fixturePath,
        candidates: candidates.length,
        extractedContexts: bridge.contexts.length,
        downloadJobs: bridge.jobs.length,
        warnings: Array.from(warnings),
      },
      null,
      2
    )
  )
}

