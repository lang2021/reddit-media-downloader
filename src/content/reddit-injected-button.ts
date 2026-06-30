const buttonAttribute = 'data-reddit-media-dry-run-button'
const actionShellAttribute = 'data-reddit-media-dry-run-action-shell'

type ClickHandler = (event: MouseEvent) => void

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
  button.textContent = 'Media'
  button.title = 'Download Reddit images / 下载 Reddit 图片'
  button.setAttribute('aria-label', 'Download Reddit images')
  button.setAttribute(buttonAttribute, 'true')
  Object.assign(button.style, {
    alignItems: 'center',
    appearance: 'none',
    background: 'rgba(0, 0, 0, 0.06)',
    border: '0',
    borderRadius: '999px',
    color: 'inherit',
    cursor: 'pointer',
    display: 'inline-flex',
    font: '600 12px/1 system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    height: '32px',
    justifyContent: 'center',
    margin: '0',
    padding: '0 12px',
    minWidth: '0',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    width: 'fit-content',
  })

  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(0, 0, 0, 0.1)'
  })
  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgba(0, 0, 0, 0.06)'
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
