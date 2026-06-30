import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { DryRunMediaBridge } from '../src/bridge/DryRunMediaBridge.ts'
import { genericMediaContextToDownloadJobs } from '../src/bridge/generic-download-jobs.ts'
import type { GenericMediaPostContext } from '../src/bridge/generic-media-types.ts'
import { redditMediaContextToGenericMediaContext } from '../src/bridge/reddit-to-generic-media.ts'
import { extractRedditMediaFromPostElement } from '../src/reddit/reddit-media-extractor.ts'
import { findRedditPostElements } from '../src/reddit/reddit-post-detector.ts'

const fixtureDir = 'tests/fixtures/reddit'

function loadFixture(name: string): Document {
  const html = readFileSync(join(fixtureDir, name), 'utf8')
  const dom = new JSDOM(html, { url: 'https://www.reddit.com/r/pics/' })
  globalThis.document = dom.window.document
  globalThis.location = dom.window.location
  globalThis.Element = dom.window.Element
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.HTMLImageElement = dom.window.HTMLImageElement
  globalThis.MutationObserver = dom.window.MutationObserver
  return dom.window.document
}

function extractGenericFixtureContext(
  name: string
): GenericMediaPostContext | null {
  const document = loadFixture(name)
  const post = findRedditPostElements(document)[0]
  assert.ok(post, `${name} should contain one post candidate`)
  const redditContext = extractRedditMediaFromPostElement(post)
  return redditContext
    ? redditMediaContextToGenericMediaContext(redditContext)
    : null
}

{
  const context = extractGenericFixtureContext('new-image-post.html')
  assert.equal(context?.platform, 'reddit')
  assert.equal(context?.postId, 'nimg123')
  assert.equal(context?.community, 'r/pics')
  assert.equal(context?.author, 'alice')
  assert.equal(context?.media[0].type, 'image')

  assert.deepEqual(genericMediaContextToDownloadJobs(context!), [
    {
      url: 'https://i.redd.it/nimg123.jpg',
      filename: 'reddit_r_pics_alice_nimg123_1.jpg',
      metadata: {
        platform: 'reddit',
        postId: 'nimg123',
        mediaType: 'image',
        index: 1,
      },
    },
  ])
}

{
  const context = extractGenericFixtureContext('new-gallery-post.html')
  const jobs = genericMediaContextToDownloadJobs(context!)
  assert.equal(context?.media.length, 3)
  assert.equal(jobs.length, 3)
  assert.deepEqual(
    jobs.map(job => job.metadata?.index),
    [1, 2, 3]
  )
}

{
  const context = extractGenericFixtureContext('new-video-post.html')
  const jobs = genericMediaContextToDownloadJobs(context!, { mode: 'aria2' })
  assert.equal(context?.media[0].type, 'video')
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].mode, 'aria2')
  assert.equal(jobs[0].metadata?.mediaType, 'video')
}

{
  const context = extractGenericFixtureContext('unsupported-video-post.html')
  const jobs = genericMediaContextToDownloadJobs(context!)
  assert.equal(context?.media[0].type, 'unsupported')
  assert.equal(jobs.length, 0)
  assert.ok(context?.warnings?.includes('video_requires_manifest_or_audio_merge'))
}

{
  const context = extractGenericFixtureContext('non-media-post.html')
  assert.equal(context, null)
}

{
  const context: GenericMediaPostContext = {
    platform: 'reddit',
    postId: 'abc/123',
    author: 'some:user',
    community: 'r/pics and videos',
    title: 'ignored',
    media: [
      {
        type: 'image',
        url: 'https://i.redd.it/file name.jpg?utm_source=share',
        index: 0,
      },
    ],
  }
  const jobs = genericMediaContextToDownloadJobs(context)
  assert.equal(jobs[0].filename, 'reddit_r_pics_and_videos_some_user_abc_123_1.jpg')
}

{
  const context = extractGenericFixtureContext('new-image-post.html')
  assert.equal(context?.title, 'Representative new Reddit image post')
  assert.equal(
    context?.permalink,
    'https://www.reddit.com/r/pics/comments/nimg123/representative_new_reddit_image_post/'
  )
  assert.equal(context?.media[0].source, 'i.redd.it')
  assert.equal(context?.media[0].quality, 'original')
}

{
  const context = extractGenericFixtureContext('new-gallery-post.html')
  const jobs = genericMediaContextToDownloadJobs(context!)
  const bridge = new DryRunMediaBridge()
  bridge.receiveContext(context!)
  bridge.receiveDownloadJobs(jobs)

  assert.equal(bridge.contexts.length, 1)
  assert.equal(bridge.jobs.length, 3)
  assert.equal(bridge.contexts[0].postId, 'ngal456')
}

console.log('reddit generic bridge checks passed')

