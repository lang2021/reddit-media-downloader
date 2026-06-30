import type { GenericDownloadJob, GenericMediaPostContext } from '../bridge/generic-media-types.ts'
import type { StartDownloadResponse } from '../messages/download-messages.ts'

const panelId = 'reddit-media-dry-run-panel'

type DryRunPanelPayload = {
  context: GenericMediaPostContext
  jobs: GenericDownloadJob[]
  response?: StartDownloadResponse
}

export function showRedditDryRunPanel(
  payload: DryRunPanelPayload,
  root: Document = document
): HTMLElement {
  const panel = upsertPanel(root)
  const warnings = payload.context.warnings ?? []
  const response = payload.response
  const failures = response?.results.filter(result => !result.ok) ?? []
  const successes = response?.results.filter(result => result.ok) ?? []

  panel.replaceChildren(
    makeLine(root, panelTitle(response), 'strong'),
    makeLine(root, `Post / 帖子: ${payload.context.postId}`),
    makeLine(root, `Mode / 模式: ${response?.mode ?? 'dry-run'}`),
    makeLine(
      root,
      `Real download / 真实下载: ${response?.realDownloadExecuted ? 'yes' : 'no'}`
    ),
    makeLine(root, `Jobs / 任务: ${payload.jobs.length}`),
    makeLine(root, `Success / 成功: ${successes.length}`),
    makeLine(root, `Failure / 失败: ${failures.length}`),
    makeJobList(root, payload.jobs),
    makeErrorList(root, failures),
    makeLine(
      root,
      (response?.warnings ?? warnings).length
        ? `Warnings / 警告: ${(response?.warnings ?? warnings).join(', ')}`
        : 'Warnings / 警告: none'
    )
  )

  return panel
}

function panelTitle(response: StartDownloadResponse | undefined): string {
  if (!response || response.mode === 'dry-run') {
    return 'Dry Run: no files downloaded / 试运行：未下载文件'
  }
  if (response.mode === 'chrome') return 'Chrome Download / Chrome 下载'
  return 'Aria2 Download / Aria2 下载'
}

function upsertPanel(root: Document): HTMLElement {
  const existing = root.getElementById(panelId)
  if (existing) return existing

  const panel = root.createElement('aside')
  panel.id = panelId
  panel.setAttribute('role', 'status')
  panel.setAttribute('aria-live', 'polite')
  Object.assign(panel.style, {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: '2147483647',
    maxWidth: '360px',
    padding: '12px',
    border: '1px solid #9ca3af',
    borderRadius: '8px',
    background: '#111827',
    color: '#f9fafb',
    font: '12px/1.45 system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.25)',
  })

  root.body.append(panel)
  return panel
}

function makeLine(
  root: Document,
  text: string,
  tagName: 'div' | 'strong' = 'div'
): HTMLElement {
  const element = root.createElement(tagName)
  element.textContent = text
  element.style.display = 'block'
  element.style.margin = tagName === 'strong' ? '0 0 6px' : '3px 0'
  return element
}

function makeJobList(root: Document, jobs: GenericDownloadJob[]): HTMLElement {
  const list = root.createElement('ol')
  Object.assign(list.style, {
    margin: '6px 0',
    paddingInlineStart: '18px',
  })

  if (jobs.length === 0) {
    const item = root.createElement('li')
    item.textContent = 'No executable jobs / 没有可执行任务'
    list.append(item)
    return list
  }

  for (const job of jobs.slice(0, 5)) {
    const item = root.createElement('li')
    item.textContent = job.filename
    list.append(item)
  }

  if (jobs.length > 5) {
    const item = root.createElement('li')
    item.textContent = `+${jobs.length - 5} more / 另有 ${jobs.length - 5} 个`
    list.append(item)
  }

  return list
}

function makeErrorList(
  root: Document,
  failures: StartDownloadResponse['results']
): HTMLElement {
  const list = root.createElement('ul')
  Object.assign(list.style, {
    margin: '6px 0',
    paddingInlineStart: '18px',
  })

  for (const failure of failures.slice(0, 3)) {
    const item = root.createElement('li')
    item.textContent = failure.error ?? 'unknown_error'
    list.append(item)
  }

  return list
}
