import {
  closestRedditPostElement,
  findRedditPostElements,
} from './reddit-post-detector.ts'
import { extractRedditMediaFromPostElement } from './reddit-media-extractor.ts'
import type { RedditMediaContext } from './reddit-types.ts'

type RedditMediaObserverOptions = {
  root?: ParentNode
  onPostMedia: (context: RedditMediaContext, element: Element) => void
}

export class RedditMediaObserver {
  private observer?: MutationObserver
  private scanRoot?: ParentNode
  private readonly pendingRoots = new Set<ParentNode>()
  private timer?: ReturnType<typeof setTimeout>
  private recoveryTimer?: ReturnType<typeof setTimeout>
  private readonly startupRecoveryTimers: Array<ReturnType<typeof setTimeout>> = []

  constructor(private readonly options: RedditMediaObserverOptions) {}

  start(): void {
    const root = this.options.root ?? document.body
    this.scanRoot = root
    this.scan(root)
    this.scheduleStartupRecoveryScans()

    this.observer = new MutationObserver(mutations => {
      const roots = new Set<ParentNode>()
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element) addScanRoot(roots, node)
        }
        if (mutation.target instanceof Element) {
          addScanRoot(roots, mutation.target)
        }
      }
      this.scheduleScan(roots)
      this.scheduleRecoveryScan()
    })

    this.observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'href', 'style', 'data-url', 'data-src'],
    })
  }

  stop(): void {
    this.observer?.disconnect()
    this.observer = undefined
    this.scanRoot = undefined
    if (this.timer) clearTimeout(this.timer)
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer)
    for (const timer of this.startupRecoveryTimers) clearTimeout(timer)
    this.pendingRoots.clear()
    this.recoveryTimer = undefined
    this.startupRecoveryTimers.length = 0
  }

  private scheduleScan(roots: Set<ParentNode>): void {
    for (const root of roots) this.pendingRoots.add(root)
    if (this.timer) return

    this.timer = setTimeout(() => {
      const rootsToScan = Array.from(this.pendingRoots)
      this.pendingRoots.clear()
      this.timer = undefined
      for (const root of rootsToScan) this.scan(root)
    }, 50)
  }

  private scheduleStartupRecoveryScans(): void {
    for (const delay of [300, 1200, 3000]) {
      this.startupRecoveryTimers.push(
        setTimeout(() => {
          if (this.scanRoot) this.scan(this.scanRoot)
        }, delay)
      )
    }
  }

  private scheduleRecoveryScan(): void {
    if (this.recoveryTimer) return

    this.recoveryTimer = setTimeout(() => {
      this.recoveryTimer = undefined
      if (this.scanRoot) this.scan(this.scanRoot)
    }, 1000)
  }

  private scan(root: ParentNode): void {
    for (const element of findRedditPostElements(root)) {
      const context = extractRedditMediaFromPostElement(element)
      if (!context) continue

      this.options.onPostMedia(context, element)
    }
  }
}

function addScanRoot(roots: Set<ParentNode>, element: Element): void {
  roots.add(element)
  const post = closestRedditPostElement(element)
  if (post) roots.add(post)
}
