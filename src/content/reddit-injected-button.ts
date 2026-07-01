const buttonAttribute = 'data-reddit-media-dry-run-button'
const actionShellAttribute = 'data-reddit-media-dry-run-action-shell'
const stateAttribute = 'data-reddit-media-download-state'
const downloadIconPath =
  'M12,16l-5.7-5.7l1.4-1.4l3.3,3.3V2.6h2v9.6l3.3-3.3l1.4,1.4L12,16z M21,15l0,3.5c0,1.4-1.1,2.5-2.5,2.5h-13C4.1,21,3,19.9,3,18.5V15h2v3.5C5,18.8,5.2,19,5.5,19h13c0.3,0,0.5-0.2,0.5-0.5l0-3.5H21z'
const downloadedIconPath =
  'M17.5,16.5h-11v-3h11V16.5z M17.5,9.3h-11v3h11V9.3z M17.5,5h-11v3h11V5z M19,15l0,3.5c0,0.3-0.2,0.5-0.5,0.5h-13C5.2,19,5,18.8,5,18.5V15H3v3.5C3,19.9,4.1,21,5.5,21h13c1.4,0,2.5-1.1,2.5-2.5l0-3.5H19z'

type ClickHandler = (event: MouseEvent) => void
export type RedditDownloadButtonState = 'default' | 'downloaded'

export function hasRedditDryRunButton(postElement: Element): boolean {
  const host = resolveButtonHost(postElement)
  return Boolean(host.querySelector(`[${buttonAttribute}="true"]`))
}

export function injectRedditDryRunButton(
  postElement: Element,
  onClick: ClickHandler
): HTMLButtonElement | null {
  const host = resolveButtonHost(postElement)
  const existing = host.querySelector<HTMLButtonElement>(
    `[${buttonAttribute}="true"]`
  )
  if (existing) return existing

  const root = postElement.ownerDocument
  const button = root.createElement('button')
  button.type = 'button'
  button.title = 'Download Reddit images / 下载 Reddit 图片'
  button.setAttribute('aria-label', 'Download Reddit images')
  button.setAttribute(buttonAttribute, 'true')
  button.setAttribute(stateAttribute, 'default')
  button.append(createDownloadIcon(root))
  Object.assign(button.style, {
    alignItems: 'center',
    appearance: 'none',
    background: '#b8f8c5',
    border: '0',
    borderRadius: '999px',
    color: '#0f3d1e',
    cursor: 'pointer',
    display: 'inline-flex',
    font: '600 12px/1 system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    height: '32px',
    justifyContent: 'center',
    margin: '0',
    padding: '0',
    minWidth: '32px',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    width: '32px',
  })

  button.addEventListener('mouseenter', () => {
    button.style.background = getButtonPalette(button).hoverBackground
  })
  button.addEventListener('mouseleave', () => {
    button.style.background = getButtonPalette(button).background
  })
  button.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    onClick(event)
  })

  const actionRow = host.querySelector<HTMLElement>(
    '[aria-label="Actions available for this post"]'
  )
  if (actionRow) {
    attachButtonToActionShell(root, actionRow, button)
    return button
  }

  applyFallbackButtonLayout(button)
  if (host instanceof HTMLElement) {
    const { position } = host.style
    if (!position || position === 'static') host.style.position = 'relative'
  }
  host.append(button)
  return button
}

export function applyRedditDownloadButtonState(
  button: HTMLButtonElement,
  state: RedditDownloadButtonState
): void {
  button.setAttribute(stateAttribute, state)
  button.title =
    state === 'downloaded'
      ? 'Downloaded Reddit images / 已下载 Reddit 图片'
      : 'Download Reddit images / 下载 Reddit 图片'
  button.setAttribute(
    'aria-label',
    state === 'downloaded' ? 'Reddit images downloaded' : 'Download Reddit images'
  )

  const palette = getButtonPalette(button)
  button.style.background = palette.background
  button.style.color = palette.color
  const path = button.querySelector('path')
  path?.setAttribute('d', state === 'downloaded' ? downloadedIconPath : downloadIconPath)
}

function createDownloadIcon(root: Document): SVGSVGElement {
  const svg = root.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  Object.assign(svg.style, {
    display: 'block',
    height: '16px',
    width: '16px',
  })

  const path = root.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', downloadIconPath)
  path.setAttribute('fill', 'currentColor')
  svg.append(path)

  return svg
}

function getButtonPalette(button: HTMLButtonElement): {
  background: string
  hoverBackground: string
  color: string
} {
  if (button.getAttribute(stateAttribute) === 'downloaded') {
    return {
      background: '#fff0b8',
      hoverBackground: '#ffe58a',
      color: '#7a5200',
    }
  }

  return {
    background: '#b8f8c5',
    hoverBackground: '#a7efb8',
    color: '#0f3d1e',
  }
}

function resolveButtonHost(postElement: Element): Element {
  return postElement.querySelector('shreddit-post') ?? postElement
}

function attachButtonToActionShell(
  root: Document,
  actionRow: HTMLElement,
  button: HTMLButtonElement
): void {
  const existingShell = actionRow.closest<HTMLElement>(
    `[${actionShellAttribute}="true"]`
  )
  const shell =
    existingShell ??
    createActionShell(root, actionRow)

  if (actionRow.parentElement !== shell) {
    shell.prepend(actionRow)
  }

  Object.assign(actionRow.style, {
    flex: '1 1 auto',
    margin: '0',
    minWidth: '0',
  })

  Object.assign(button.style, {
    flex: '0 0 auto',
    marginLeft: '12px',
    position: 'static',
    right: '',
    bottom: '',
    zIndex: '',
  })

  shell.append(button)
}

function createActionShell(root: Document, actionRow: HTMLElement): HTMLElement {
  const shell = root.createElement('div')
  shell.setAttribute(actionShellAttribute, 'true')
  Object.assign(shell.style, {
    alignItems: 'center',
    display: 'flex',
    gap: '0',
    margin: '0',
    minWidth: '0',
    width: '100%',
  })

  actionRow.parentElement?.insertBefore(shell, actionRow)
  shell.append(actionRow)
  return shell
}

function applyFallbackButtonLayout(button: HTMLButtonElement): void {
  Object.assign(button.style, {
    bottom: '12px',
    position: 'absolute',
    right: '12px',
    zIndex: '2147483646',
  })
}
