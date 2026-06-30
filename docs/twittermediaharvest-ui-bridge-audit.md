# TwitterMediaHarvest UI Bridge Audit / TwitterMediaHarvest UI 桥接审计

## Summary / 摘要

This audit records the TwitterMediaHarvest files inspected for the Reddit bridge boundary.

本审计记录为 Reddit bridge boundary 检查过的 TwitterMediaHarvest 文件。

The useful reusable boundary is narrow: the later downloader path ultimately accepts a URL and filename through `DownloadTarget`, but the current content-script message flow is still X/Twitter-specific.

可复用边界很窄：后续 downloader path 最终通过 `DownloadTarget` 接收 URL 与 filename，但当前 content-script message flow 仍然强绑定 X/Twitter。

## Files Inspected / 已检查文件

| Area | Files |
| --- | --- |
| Media item and tweet media model / media item 与 tweet media model | `src/domain/valueObjects/tweet.ts`, `src/domain/valueObjects/tweetMedia.ts`, `src/domain/valueObjects/tweetMediaFile.ts`, `src/domain/valueObjects/tweetInfo.ts`, `src/domain/factories/tweetToTweetMediaFiles.ts` |
| Injected button input / 注入按钮输入 | `src/contentScript/core/Harvester.ts`, `src/contentScript/utils/button.ts` |
| Message payloads / 消息 payload | `src/libs/webExtMessage/messages/downloadTweetMedia.ts`, `src/libs/webExtMessage/messages/checkDownloadHistory.ts`, `src/libs/webExtMessage/messages/base.ts` |
| Service worker routing / service worker 路由 | `src/serviceWorker/initMessageRouter.ts`, `src/serviceWorker/messageRouter.ts`, `src/serviceWorker/messageHandlers/downloadMediaHandler.ts` |
| Download execution / 下载执行 | `src/domain/valueObjects/downloadTarget.ts`, `src/domain/valueObjects/downloadConfig.ts`, `src/infra/useCases/browserDownloadMediaFile.ts`, `src/applicationUseCases/downloadTweetMedia.ts` |
| Aria2 dispatch / Aria2 分发 | `src/infra/useCases/aria2DownloadMediaFile.ts`, `src/libs/webExtMessage/messages/aria2Donwload.ts` |
| Filename settings / 文件名设置 | `src/domain/valueObjects/filenameSetting.ts`, `src/enums/patternToken.ts`, `src/pages/components/GeneralOptions.tsx` |

## Reusable Fields / 可复用字段

- `DownloadTarget` already uses generic `url` and `filename`.
- `DownloadConfig` uses generic download settings: `url`, `filename`, `saveAs`, and `conflictAction`.
- Browser download dispatch only needs a browser download config.
- Aria2 dispatch only needs `url`, `filename`, and a referrer, although the current referrer is X-specific.

- `DownloadTarget` 已经使用通用的 `url` 与 `filename`。
- `DownloadConfig` 使用通用下载设置：`url`、`filename`、`saveAs` 与 `conflictAction`。
- Browser download dispatch 只需要 browser download config。
- Aria2 dispatch 只需要 `url`、`filename` 与 referrer，但当前 referrer 是 X-specific。

## X/Twitter-Specific Fields / X/Twitter 专属字段

- `tweetId`
- `screenName`
- `TweetInfo`
- `TweetMediaFile`
- `TweetMedia`
- `Tweet`
- `TweetMediaFile.serial`
- `PatternToken.TweetId`
- `PatternToken.TweetDate`
- `PatternToken.TweetTimestamp`
- `DownloadTweetMediaMessage`
- `CheckDownloadHistoryMessage` payload field `tweetId`
- Aria2 referrer `https://x.com/i/web/status/{tweetId}`

- 以上字段与类型都不应直接泄漏到 Reddit UI bridge。
- These fields and types should not leak directly into the Reddit UI bridge.

## Bridge Implication / 桥接结论

Reddit should first map into a platform-neutral `GenericMediaPostContext`.

Reddit 应先映射到平台无关的 `GenericMediaPostContext`。

The reusable UI/downloader entry should receive generic post and media fields. It should not know about `subreddit`, `tweetId`, or Reddit-only details.

可复用 UI/downloader 入口应接收通用 post 与 media 字段，不应理解 `subreddit`、`tweetId` 或 Reddit-only details。

The safe v0 bridge is:

安全的 v0 bridge 是：

```text
RedditMediaContext
-> GenericMediaPostContext
-> GenericDownloadJob[]
-> DryRunMediaBridge
```

No real Chrome downloads, Aria2 RPC, service worker download execution, or UI injection should be enabled by this bridge.

本 bridge 不启用真实 Chrome downloads、Aria2 RPC、service worker download execution 或 UI injection。

