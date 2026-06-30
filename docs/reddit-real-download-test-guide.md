# Reddit Real Download Test Guide / Reddit 真实下载测试指南

## Purpose / 目的

This guide validates real download execution after the safe default dry-run path has already been verified. Real downloads only run when `enableRealDownloads` is `true` and `mode` is `chrome` or `aria2`.

本指南用于在已验证默认 dry-run 安全路径后测试真实下载。只有当 `enableRealDownloads` 为 `true` 且 `mode` 为 `chrome` 或 `aria2` 时，才会执行真实下载。

## Build And Load / 构建与加载

```sh
npm run build
```

Load the generated `dist/` directory from `chrome://extensions` with Developer mode enabled.

在 `chrome://extensions` 中启用开发者模式，然后加载生成的 `dist/` 目录。

## Confirm Default Dry-Run / 确认默认 Dry-Run

Open a Reddit page, click an injected `Media` button, and confirm the panel says real download is `no`.

打开 Reddit 页面，点击注入的 `Media` 按钮，确认面板显示 real download 为 `no`。

Default storage is safe:

默认 storage 是安全的：

```js
chrome.storage.local.get('redditMediaDownloaderSettings', console.log)
```

## Enable Chrome Downloads / 启用 Chrome 下载

In the extension service worker console, set:

在扩展 service worker console 中设置：

```js
chrome.storage.local.set({
  redditMediaDownloaderSettings: {
    mode: 'chrome',
    enableRealDownloads: true
  }
})
```

Click `Media` again. The panel should show `Chrome Download`, real download `yes`, and submitted jobs.

再次点击 `Media`。面板应显示 `Chrome Download`、real download 为 `yes`，并显示提交的任务。

## Enable Aria2 / 启用 Aria2

Start Aria2 JSON-RPC locally, then set:

先启动本地 Aria2 JSON-RPC，然后设置：

```js
chrome.storage.local.set({
  redditMediaDownloaderSettings: {
    mode: 'aria2',
    enableRealDownloads: true,
    aria2: {
      endpoint: 'http://localhost:6800/jsonrpc'
    }
  }
})
```

If Aria2 uses a secret, add `secret`. Do not log or share it.

如果 Aria2 使用 secret，可添加 `secret`。不要打印或分享它。

```js
chrome.storage.local.set({
  redditMediaDownloaderSettings: {
    mode: 'aria2',
    enableRealDownloads: true,
    aria2: {
      endpoint: 'http://localhost:6800/jsonrpc',
      secret: 'your-secret'
    }
  }
})
```

The panel should show `Aria2 Download`, real download `yes`, and returned GID-backed success results when Aria2 accepts the job.

当 Aria2 接收任务后，面板应显示 `Aria2 Download`、real download 为 `yes`，并显示带 GID 的成功结果。

## Disable Real Downloads / 关闭真实下载

Return to dry-run:

恢复 dry-run：

```js
chrome.storage.local.set({
  redditMediaDownloaderSettings: {
    mode: 'dry-run',
    enableRealDownloads: false
  }
})
```

## Network Boundary / 网络边界

The extension should not call Reddit OAuth/Data/API endpoints and should not use network interception or crawling. The only allowed task-specific network call is the configured local Aria2 JSON-RPC endpoint when Aria2 mode is explicitly enabled.

扩展不应调用 Reddit OAuth/Data/API endpoints，也不应使用网络拦截或 crawling。本任务唯一允许的特定网络调用，是在明确启用 Aria2 mode 后访问配置好的本地 Aria2 JSON-RPC endpoint。

## Known Video Limitation / 已知视频限制

`v.redd.it` remains best-effort. Direct playable video URLs can be submitted, but HLS/DASH manifests, audio discovery, audio/video merging, ffmpeg, and native helpers are still unsupported.

`v.redd.it` 仍是 best-effort。可提交 DOM 中可见的 direct playable video URLs，但仍不支持 HLS/DASH manifests、audio discovery、audio/video merging、ffmpeg 与 native helpers。
