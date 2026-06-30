import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { findRedditPostElements } from '../src/reddit/reddit-post-detector.ts'
import { extractRedditMediaFromPostElement } from '../src/reddit/reddit-media-extractor.ts'
import { redditMediaContextToDownloadJobs } from '../src/reddit/reddit-to-download-jobs.ts'
import { probeRedditMedia } from '../src/reddit/RedditMediaProbe.ts'

const fixtureDir = 'tests/fixtures/reddit'

function loadFixture(name: string): Document {
  const html = readFileSync(join(fixtureDir, name), 'utf8')
  assertFixtureSafety(name, html)

  const dom = new JSDOM(html, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.MutationObserver = dom.window.MutationObserver
  return dom.window.document
}

function extractFirstFixtureContext(name: string) {
  const document = loadFixture(name)
  const post = findRedditPostElements(document)[0]
  assert.ok(post, `${name} should contain a detectable Reddit post`)
  return extractRedditMediaFromPostElement(post)
}

function assertFixtureSafety(name: string, html: string): void {
  const unsafePatterns = [
    /cookie/i,
    /authorization/i,
    /bearer\s+[a-z0-9._-]+/i,
    /session[_-]?id/i,
    /csrf/i,
    /token/i,
    /loid/i,
    /reddit_session/i,
  ]

  for (const pattern of unsafePatterns) {
    assert.equal(
      pattern.test(html),
      false,
      `${name} contains unsafe fixture text matching ${pattern}`
    )
  }
}

{
  const context = extractFirstFixtureContext('new-image-post.html')
  assert.equal(context?.postId, 'nimg123')
  assert.equal(context?.author, 'alice')
  assert.equal(context?.subreddit, 'pics')
  assert.equal(context?.title, 'Representative new Reddit image post')
  assert.equal(context?.media.length, 1)
  assert.equal(context?.media[0].type, 'image')
  assert.equal(context?.media[0].source, 'i.redd.it')
  assert.equal(context?.media[0].quality, 'original')
  assert.equal(context?.media[0].url, 'https://i.redd.it/nimg123.jpg')

  assert.deepEqual(redditMediaContextToDownloadJobs(context!), [
    {
      url: 'https://i.redd.it/nimg123.jpg',
      filename: 'pics_alice_nimg123_01.jpg',
    },
  ])
}

{
  const context = extractFirstFixtureContext('new-gallery-post.html')
  assert.equal(context?.postId, 'ngal456')
  assert.equal(context?.media.length, 3)
  assert.deepEqual(
    context?.media.map(item => item.url),
    [
      'https://i.redd.it/ngal456-a.jpg',
      'https://i.redd.it/ngal456-b.png',
      'https://preview.redd.it/ngal456-c.jpg?width=960&format=pjpg',
    ]
  )
  assert.deepEqual(
    context?.media.map(item => item.index),
    [0, 1, 2]
  )
}

{
  const context = extractFirstFixtureContext('new-video-post.html')
  assert.equal(context?.postId, 'nvid789')
  assert.equal(context?.media.length, 1)
  assert.equal(context?.media[0].type, 'video')
  assert.equal(context?.media[0].url, 'https://v.redd.it/nvid789/DASH_720.mp4')
}

{
  const context = extractFirstFixtureContext('old-image-post.html')
  assert.equal(context?.postId, 'oldimg1')
  assert.equal(context?.author, 'bob')
  assert.equal(context?.subreddit, 'oldpics')
  assert.equal(context?.media.length, 1)
  assert.equal(context?.media[0].url, 'https://i.redd.it/oldimg1.png')
}

{
  const context = extractFirstFixtureContext('unsupported-video-post.html')
  assert.equal(context?.postId, 'badvid1')
  assert.equal(context?.media[0].type, 'unsupported')
  assert.equal(
    context?.media[0].unsupportedReason,
    'video_requires_manifest_or_audio_merge'
  )
  assert.deepEqual(new Set(context?.warnings), new Set([
    'video_poster_only',
    'video_requires_manifest_or_audio_merge',
  ]))
}

{
  const context = extractFirstFixtureContext('non-media-post.html')
  assert.equal(context, null)
}

{
  const context = extractFirstFixtureContext('avatar-icon-filtering.html')
  assert.equal(context?.postId, 'filter01')
  assert.equal(context?.media.length, 1)
  assert.equal(context?.media[0].url, 'https://i.redd.it/filter01-real.jpg')
}

{
  const context = extractFirstFixtureContext('duplicate-media-post.html')
  assert.equal(context?.postId, 'dupe01')
  assert.equal(context?.media.length, 1)
  assert.equal(context?.media[0].url, 'https://i.redd.it/dupe01.jpg')
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
  globalThis.MutationObserver = dom.window.MutationObserver

  const wrapper = dom.window.document.querySelector('.feed-wrapper')
  assert.ok(wrapper)
  const posts = findRedditPostElements(wrapper)
  const contexts = posts.map(post => extractRedditMediaFromPostElement(post))

  assert.deepEqual(posts.map(post => post.id), ['t3_wrapa', 't3_wrapb'])
  assert.deepEqual(
    contexts.map(context => context?.media.map(item => item.url)),
    [['https://i.redd.it/wrapa.jpg'], ['https://i.redd.it/wrapb.jpg']]
  )
}

{
  const document = loadFixture('real-captured/real-new-gallery-lazy-buttons.html')
  const posts = findRedditPostElements(document)
  const contexts = posts
    .map(post => extractRedditMediaFromPostElement(post))
    .filter(Boolean)

  assert.equal(contexts.length, 2)
  assert.deepEqual(
    contexts.map(context => context?.postId),
    ['realgal01', 'realgal02']
  )
  assert.equal(
    document.querySelectorAll('shreddit-ad-post').length,
    1
  )
}

{
  const document = loadFixture('new-gallery-post.html')
  const result = probeRedditMedia(document)
  assert.equal(result.totalCandidates, 1)
  assert.equal(result.extractedPosts.length, 1)
  assert.equal(result.unsupportedPosts.length, 0)
}

{
  const fixtureNames = await readdir(fixtureDir)
  const htmlFixtures = fixtureNames.filter(name => name.endsWith('.html'))
  assert.ok(htmlFixtures.length >= 5)
  for (const name of htmlFixtures) {
    const html = readFileSync(join(fixtureDir, name), 'utf8')
    assertFixtureSafety(name, html)
    assert.ok(html.length < 40_000, `${name} should stay reviewable`)
  }
}

console.log('reddit extractor representative fixture checks passed')
