import { handleDownloadMessage } from './download-router.ts'

type ChromeRuntime = {
  runtime?: {
    onMessage?: {
      addListener: (
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void
        ) => true | false | undefined
      ) => void
    }
  }
}

const chromeRuntime = (globalThis as { chrome?: ChromeRuntime }).chrome?.runtime

chromeRuntime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (
    typeof message !== 'object' ||
    message === null ||
    (message as { type?: unknown }).type !== 'START_MEDIA_DOWNLOAD'
  ) {
    return false
  }

  void handleDownloadMessage(message)
    .then(sendResponse)
    .catch(error =>
      sendResponse({
        type: 'START_MEDIA_DOWNLOAD_RESULT',
        mode: 'dry-run',
        realDownloadExecuted: false,
        results: [],
        warnings: [error instanceof Error ? error.message : String(error)],
      })
    )

  return true
})
