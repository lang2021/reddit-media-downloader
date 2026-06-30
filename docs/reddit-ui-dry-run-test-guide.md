# Reddit UI Dry-Run Test Guide / Reddit UI 试运行测试指南

## Purpose / 目的

This guide validates the injected Reddit media dry-run UI without executing browser downloads, Aria2 RPC, Reddit API calls, network interception, or external adapters.

本指南用于验证注入式 Reddit 媒体试运行 UI，不执行浏览器下载、Aria2 RPC、Reddit API 调用、网络拦截或外部站点适配。

## Build / 构建

Run:

运行：

```sh
npm run build
```

The loadable MV3 extension is written to `dist/`.

可加载的 MV3 扩展会输出到 `dist/`。

## Load In Chrome / 在 Chrome 中加载

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select the project `dist/` directory.

1. 打开 `chrome://extensions`。
2. 启用开发者模式。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目的 `dist/` 目录。

## Manual Test URLs / 手动测试 URL

Use currently visible Reddit pages only:

仅使用当前可见的 Reddit 页面：

- `https://www.reddit.com/r/pics/`
- `https://new.reddit.com/r/pics/`
- `https://old.reddit.com/r/pics/`
- Any post detail page containing direct image, gallery, GIF, or direct playable video media.
- 任意包含 direct image、gallery、GIF 或 direct playable video media 的帖子详情页。

## Expected Behavior / 预期行为

- Media-bearing posts receive a small `Media` button.
- Clicking the button extracts the Reddit DOM context, converts it to the generic media context, builds dry-run download jobs, logs the result to the console, and shows a small fixed panel.
- Unsupported manifest-only video produces no executable download job and preserves warnings such as `video_requires_manifest_or_audio_merge`.
- Text-only or link-only posts should not create executable jobs.

- 含媒体的帖子会出现一个小型 `Media` 按钮。
- 点击按钮后，会从 Reddit DOM 提取上下文，转换为 generic media context，生成 dry-run download jobs，在控制台输出结果，并显示一个小型固定面板。
- 仅有 manifest 的 unsupported video 不会生成可执行下载任务，并保留 `video_requires_manifest_or_audio_merge` 等警告。
- 纯文本或无可下载媒体的链接帖不应生成可执行任务。

## No Real Download Boundary / 无真实下载边界

This dry run must not call:

本试运行不得调用：

- `chrome.downloads.download`
- Aria2 RPC such as `aria2.addUri`
- Reddit OAuth/Data/API endpoints
- Network interception or crawler logic

## DOM Capture For Future Fixtures / 后续 Fixture 的 DOM 捕获

When a real Reddit DOM case fails, copy only the smallest sanitized post container needed to reproduce the extraction issue. Remove cookies, authorization values, tokens, user-identifying text, private URLs, and unrelated page chrome before saving a fixture.

当真实 Reddit DOM 案例失败时，只复制能复现提取问题的最小 sanitized post container。保存 fixture 前移除 cookie、authorization values、tokens、可识别用户文本、私密 URL 与无关页面外壳。

Suggested target:

建议保存到：

```text
tests/fixtures/reddit/
```
