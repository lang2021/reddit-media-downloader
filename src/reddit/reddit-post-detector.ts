import type { RedditPostMetadata } from './reddit-types.ts'

const postSelector = [
  'shreddit-post',
  '[data-post-id]',
  '.thing.link',
  '.thing[id^="thing_t3_"]',
  '[data-fullname^="t3_"]',
  'article',
].join(',')

const mediaSelector = [
  'img[src]',
  'img[srcset]',
  'source[src]',
  'source[srcset]',
  'video',
  'shreddit-gallery',
  'a[href*="i.redd.it"]',
  'a[href*="preview.redd.it"]',
  'a[href*="external-preview.redd.it"]',
  'a[href*="v.redd.it"]',
  'a[href*=".gif"]',
  'a[href*=".gifv"]',
  'a[href*=".mp4"]',
].join(',')

const commentsPattern = /\/comments\/([a-z0-9]+)(?:\/|$)/i

export function isRedditPostElement(element: Element): boolean {
  return Boolean(extractRedditPostMetadata(element))
}

export function findRedditPostElements(root: ParentNode): Element[] {
  const found = new Set<Element>()

  if (root instanceof Element) {
    if (isRedditPostElement(root)) addPost(found, root)
    const closestPost = closestRedditPostElement(root)
    if (closestPost) addPost(found, closestPost)
  }

  for (const element of Array.from(root.querySelectorAll(postSelector))) {
    if (isRedditPostElement(element)) addPost(found, element)
  }

  for (const media of Array.from(root.querySelectorAll(mediaSelector))) {
    const post = closestRedditPostElement(media)
    if (post) addPost(found, post)
  }

  return Array.from(found)
}

export function isRedditMediaElement(element: Element): boolean {
  return element.matches(mediaSelector)
}

function addPost(found: Set<Element>, element: Element): void {
  for (const existing of Array.from(found)) {
    if (existing === element) return
    if (element.contains(existing)) return
    if (existing.contains(element)) found.delete(existing)
  }

  found.add(element)
}

export function closestRedditPostElement(element: Element): Element | null {
  const direct = element.closest(postSelector)
  if (direct && isRedditPostElement(direct)) return direct

  let current: Element | null = element.parentElement
  while (current) {
    if (isPageShellElement(current)) return null
    if (extractPostIdFromPermalink(current)) return current
    current = current.parentElement
  }

  return null
}

function isPageShellElement(element: Element): boolean {
  return ['html', 'body', 'main', 'shreddit-feed'].includes(
    element.tagName.toLowerCase()
  )
}

export function extractRedditPostMetadata(
  element: Element
): RedditPostMetadata | null {
  if (isPageShellElement(element)) return null

  const postId = extractPostId(element)
  if (!postId) return null

  const postFullname =
    readAttr(element, 'data-fullname') ??
    readAttr(element, 'fullname') ??
    readAttr(element, 'name') ??
    `t3_${postId}`

  return {
    postId,
    postFullname: postFullname.startsWith('t3_')
      ? postFullname
      : `t3_${postId}`,
    subreddit: cleanSubreddit(
      readAttr(element, 'subreddit-name') ??
        readAttr(element, 'subreddit-prefixed-name') ??
        readAttr(element, 'data-subreddit-prefixed-name') ??
        readAttr(element, 'data-subreddit') ??
        readAttr(element, 'subreddit') ??
        textFromFirst(element, '[data-testid="subreddit-name"], a[href^="/r/"]')
    ),
    author: cleanAuthor(
      readAttr(element, 'author') ??
        readAttr(element, 'data-author') ??
        readAttr(element, 'author-name') ??
        textFromFirst(element, '[data-testid="post_author_link"], a[href^="/user/"], a[href^="/u/"]')
    ),
    title:
      readAttr(element, 'post-title') ??
      readAttr(element, 'aria-label') ??
      textFromFirst(element, 'h1, h2, h3, [slot="title"], .title > a'),
    permalink: extractPermalink(element),
  }
}

function extractPostId(element: Element): string | undefined {
  const explicit =
    readAttr(element, 'data-post-id') ??
    readAttr(element, 'post-id') ??
    readAttr(element, 'id')?.match(/^t3_[a-z0-9]+$/i)?.[0] ??
    readAttr(element, 'thingid')
  if (explicit) return cleanPostId(explicit)

  const fullname = readAttr(element, 'data-fullname') ?? readAttr(element, 'id')
  const fullnameMatch = fullname?.match(/(?:thing_)?t3_([a-z0-9]+)/i)
  if (fullnameMatch) return fullnameMatch[1]

  return extractPostIdFromPermalink(element)
}

function extractPostIdFromPermalink(element: Element): string | undefined {
  const permalink = extractPermalink(element)
  return permalink?.match(commentsPattern)?.[1]
}

function extractPermalink(element: Element): string | undefined {
  const attr =
    readAttr(element, 'permalink') ??
    readAttr(element, 'data-permalink') ??
    readAttr(element, 'content-href')
  if (attr && commentsPattern.test(attr)) return absoluteRedditUrl(attr)

  const anchor = element.querySelector<HTMLAnchorElement>('a[href*="/comments/"]')
  const href = anchor?.getAttribute('href')
  return href ? absoluteRedditUrl(href) : undefined
}

function readAttr(element: Element, name: string): string | undefined {
  const value = element.getAttribute(name)
  return value && value.trim() ? value.trim() : undefined
}

function textFromFirst(element: Element, selector: string): string | undefined {
  const text = element.querySelector(selector)?.textContent?.trim()
  return text || undefined
}

function cleanPostId(value: string): string {
  return value.replace(/^(?:thing_)?t3_/i, '')
}

function cleanSubreddit(value: string | undefined): string | undefined {
  return value?.replace(/^r\//i, '').trim() || undefined
}

function cleanAuthor(value: string | undefined): string | undefined {
  return value?.replace(/^(?:u\/|user\/)/i, '').trim() || undefined
}

function absoluteRedditUrl(value: string): string {
  try {
    return new URL(value, globalThis.location?.href ?? 'https://www.reddit.com/').href
  } catch {
    return value
  }
}
