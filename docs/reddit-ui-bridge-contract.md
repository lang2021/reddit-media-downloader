# Reddit UI Bridge Contract / Reddit UI 桥接契约

## Purpose / 目的

This document defines the bridge contract between the Reddit DOM extractor and a future TwitterMediaHarvest-style UI/downloader flow.

本文档定义 Reddit DOM extractor 与未来 TwitterMediaHarvest 风格 UI/downloader flow 之间的 bridge contract。

Task 4 does not inject UI and does not execute downloads. It only validates data conversion and dry-run delivery.

Task 4 不注入 UI，也不执行下载。它只验证数据转换与 dry-run delivery。

## Why Platform-Neutral / 为什么平台无关

The reused UI should not understand Reddit-specific concepts such as `subreddit` or X/Twitter-specific concepts such as `tweetId`.

复用 UI 不应理解 Reddit-specific concepts（如 `subreddit`），也不应理解 X/Twitter-specific concepts（如 `tweetId`）。

The UI-facing model is `GenericMediaPostContext`, which uses generic fields:

UI-facing model 是 `GenericMediaPostContext`，使用通用字段：

- `platform`
- `postId`
- `author`
- `community`
- `title`
- `permalink`
- `media`
- `warnings`

## Reddit To Generic Mapping / Reddit 到 Generic 映射

| RedditMediaContext | GenericMediaPostContext |
| --- | --- |
| `platform` | `platform = "reddit"` |
| `postId` | `postId` |
| `author` | `author` |
| `subreddit` | `community` |
| `title` | `title` |
| `permalink` | `permalink` |
| `media[]` | `media[]` |
| `warnings[]` | `warnings[]` |

The Reddit adapter normalizes community labels to `r/{name}` when possible.

Reddit adapter 会尽量把 community label 规范化为 `r/{name}`。

Unsupported media remains represented as `type: "unsupported"` and warnings are preserved.

Unsupported media 保持为 `type: "unsupported"`，warnings 不会被静默丢弃。

## Generic To Download Jobs / Generic 到 Download Jobs

`genericMediaContextToDownloadJobs()` converts supported generic media into `GenericDownloadJob[]`.

`genericMediaContextToDownloadJobs()` 会把 supported generic media 转换成 `GenericDownloadJob[]`。

Default filename template:

默认文件名模板：

```text
{platform}_{community}_{author}_{postId}_{index}.{ext}
```

Example:

示例：

```text
reddit_r_pics_alice_nimg123_1.jpg
```

Rules:

规则：

- Unsupported media does not create executable jobs.
- Media without `url` does not create executable jobs.
- Filenames are sanitized.
- Extension is inferred from URL.
- Job metadata preserves `platform`, `postId`, `mediaType`, and 1-based `index`.

- Unsupported media 不创建可执行 job。
- 没有 `url` 的 media 不创建可执行 job。
- 文件名会被 sanitize。
- 扩展名从 URL 推断。
- Job metadata 保留 `platform`、`postId`、`mediaType` 与从 1 开始的 `index`。

## Dry-Run Sink / Dry-run 接收器

`DryRunMediaBridge` receives generic contexts and download jobs in memory.

`DryRunMediaBridge` 在内存中接收 generic contexts 与 download jobs。

It does not call Chrome downloads, Aria2, service workers, network APIs, or UI rendering.

它不会调用 Chrome downloads、Aria2、service workers、network APIs 或 UI rendering。

## Reusable TwitterMediaHarvest Assumptions / 可复用的 TwitterMediaHarvest 假设

- A content script can detect a post and attach future UI.
- Button state can be driven by a post/media context.
- Runtime messages can later carry a payload to the service worker.
- The final downloader abstraction can accept URL and filename.
- Filename settings can later be generalized from tweet tokens to post/media tokens.

- content script 可以检测 post 并在未来挂接 UI。
- button state 可以由 post/media context 驱动。
- runtime messages 未来可以携带 payload 到 service worker。
- 最终 downloader abstraction 可以接收 URL 与 filename。
- filename settings 未来可以从 tweet tokens 泛化为 post/media tokens。

## Assumptions That Must Not Leak / 不应泄漏的假设

- `tweetId`
- `screenName`
- `TweetInfo`
- X transaction id capture
- Twitter API/cache solution fetching
- X hard-coded Aria2 referrer
- Tweet-specific filename tokens

- 以上 X/Twitter-specific assumptions 不应进入 Reddit bridge。

## Task 5 Direction / Task 5 方向

Task 5 should wire the Reddit bridge into an injected UI dry run.

Task 5 应将 Reddit bridge 接入 injected UI dry run。

It should still avoid real Chrome downloads and Aria2 execution until the UI/message contract is validated.

在 UI/message contract 验证前，它仍应避免真实 Chrome downloads 与 Aria2 execution。

