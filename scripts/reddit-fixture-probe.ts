import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { probeRedditMedia } from '../src/reddit/RedditMediaProbe.ts'

const fixturePaths = process.argv.slice(2)

if (fixturePaths.length === 0) {
  console.error('Usage: npm run probe:fixture -- tests/fixtures/reddit/new-image-post.html')
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

  console.log(
    JSON.stringify(
      {
        fixture: fixturePath,
        ...probeRedditMedia(dom.window.document),
      },
      null,
      2
    )
  )
}

