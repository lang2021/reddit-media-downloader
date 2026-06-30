# PROGRESS.md

Last updated: 2026/06/30 23:52

## Current Stage

Incomplete Reddit gallery image downloads fixed; Chrome retest pending.

Reddit gallery 图片下载不完整问题已修复；等待 Chrome 复测。

## Active Version / Mode

Reddit DOM-only extractor, click-time gallery JSON completion, platform-neutral bridge, injected UI, service worker message route, and Chrome image download path are implemented. Storage-level dry-run remains the default, but the Reddit `Media` button explicitly requests Chrome image downloads.

Reddit DOM-only extractor、点击时 gallery JSON 补全、platform-neutral bridge、injected UI、service worker message route 与 Chrome image download path 已实现。Storage-level dry-run 仍是默认模式，但 Reddit `Media` 按钮会显式请求 Chrome 图片下载。

## Recently Completed Work

- Fixed real Reddit lazy-media button injection by scanning closest post containers when media nodes mutate.
- Fixed post detection so root media nodes can resolve their closest Reddit post.
- Prevented page shell elements such as `body`, `main`, and `shreddit-feed` from being misclassified as posts through fallback permalink detection.
- Replaced the primary absolute bottom-right placement with a local action-shell layout when the detected post host exposes an in-host action row.
- Kept the button outside Reddit's native action-button group while aligning it on the same baseline at the far right.
- Preserved the compact bottom-right fallback for posts whose detected host still has no in-host action row, and raised fallback stacking priority to keep the button clickable.
- Simplified button host resolution to one stable path: `postElement.querySelector('shreddit-post') ?? postElement`.
- Changed `Media` button clicks to request Chrome downloads for image media only.
- Filtered non-image media out of Reddit click downloads and added warnings for skipped non-image media and posts with no downloadable images.
- Added a download-router override for per-request `requestedMode: "chrome"` while keeping storage settings unchanged.
- Added a zero-job router guard so image-free posts do not report real download execution.
- Fixed over-broad Reddit post detection by preferring the smallest valid post element over a feed/container wrapper.
- Added regression coverage proving one wrapper containing two posts yields two separate post contexts, and clicking the second post button sends only the second post's image job.
- Added click-time Reddit gallery JSON metadata completion so lazy-loaded galleries can download all images, not only the subset currently present in the DOM.
- Added fallback warnings for gallery metadata fetch failures or unavailable metadata while preserving already detected DOM images.
- Prepared the completed image-download baseline for a local Git snapshot.
- Made Reddit media observation idempotent so buttons are re-added when Reddit virtualized DOM removes them.
- Fixed debounced mutation scanning so roots from rapid consecutive mutations are accumulated instead of overwritten.
- Fixed a real-page missed-button case by rescanning the observer root once per debounced Reddit mutation batch.
- Reworked observer scheduling so local mutation roots scan quickly with a 50ms throttle, while finite root recovery sweeps handle missed posts.
- Added an `AGENTS.md` rule requiring reuse of mature open-source GitHub/npm solutions when they fit project constraints.
- Added an `AGENTS.md` rule requiring bug analysis to start from first principles before choosing a fix.
- Added an `AGENTS.md` rule to avoid reading `ITERATION_LOG.md` unless necessary and to default to append-only updates.
- Updated UI regression coverage back to bottom-right host-relative placement while keeping promoted/ad exclusion and observer coverage.
- Rebuilt `dist/` for Chrome manual retesting.

- 已通过 media node mutation 回扫 closest post container，修复真实 Reddit lazy-media button injection。
- 已修复 root media node 可解析 closest Reddit post。
- 已阻止 `body`、`main`、`shreddit-feed` 等页面壳元素通过 fallback permalink detection 被误判为 post。
- 已在检测到的帖子宿主存在 in-host action row 时，将主布局从 absolute 右下角改为本地 action-shell 横排布局。
- 已保持按钮不插入 Reddit 原生 action-button group，同时将其放到同一排最右侧。
- 已为仍然找不到 in-host action row 的帖子保留紧凑 pill 右下角 fallback，并提高 fallback stacking priority 以保证可点击。
- 已将按钮宿主解析简化为单一路径：`postElement.querySelector('shreddit-post') ?? postElement`。
- 已将 `Media` 按钮点击改为只对 image media 请求 Chrome 下载。
- 已在 Reddit 点击下载中滤掉 non-image media，并为跳过 non-image media 与无可下载图片的帖子添加 warnings。
- 已为 per-request `requestedMode: "chrome"` 添加 download-router override，同时保持 storage settings 不变。
- 已添加 zero-job router guard，避免无图片帖子被标记为执行了真实下载。
- 已通过优先选择最小 valid post element 修复过宽 Reddit post detection，避免 feed/container wrapper 被当成帖子。
- 已添加回归覆盖：一个 wrapper 包含两个帖子时会得到两个独立 post context，点击第二个帖子按钮只发送第二个帖子的图片 job。
- 已添加点击时 Reddit gallery JSON metadata 补全，使 lazy-loaded gallery 可下载全部图片，而不只下载当前 DOM 中已有的少数图片。
- 已为 gallery metadata fetch 失败或 metadata 不可用添加 fallback warnings，同时保留已检测到的 DOM 图片。
- 已将当前图片下载功能基线准备为本地 Git 快照。
- 已将 Reddit media observation 改为幂等通知，使 Reddit virtualized DOM 移除按钮后可以自动补回。
- 已修复 debounced mutation scanning，快速连续 mutation 的 roots 会累积而不是被覆盖。
- 已通过每个 debounced Reddit mutation batch 重新扫描 observer root，修复真实页面单帖漏按钮场景。
- 已重做 observer scheduling：local mutation roots 通过 50ms throttle 快速扫描，有限 root recovery sweeps 负责补漏。
- 已在 `AGENTS.md` 增加规则：当成熟 GitHub/npm 开源方案符合项目约束时，应优先复用，避免重复造轮子。
- 已在 `AGENTS.md` 增加规则：分析 bug 时要先从第一性原理出发，再决定修复方式。
- 已在 `AGENTS.md` 增加规则：非必要不读取 `ITERATION_LOG.md`，默认只追加新记录，不回读旧内容。
- 已将 UI 回归覆盖恢复为右下角 host-relative placement，同时保留 promoted/ad exclusion 与 observer 覆盖。
- 已重新构建 `dist/`，可供 Chrome 手动复测。

## Current Limitations

- No options page exists; the current Reddit `Media` button path does not need manual storage settings for Chrome image downloads.
- Manual real Reddit retest after reloading the rebuilt extension is still pending, especially for multi-image gallery posts whose visible count exceeds initially loaded DOM images.
- Existing accidental extra downloads are outside code recovery scope.
- No download history persistence exists.
- Video and GIF-style downloads are intentionally skipped for now; `v.redd.it` remains best-effort extraction only with no real video download path, HLS/DASH parsing, audio discovery, audio/video merging, ffmpeg, or native helper.
- Manual visual confirmation in Chrome is still required after reloading the rebuilt `dist/`.

- 尚无 options page；当前 Reddit `Media` 按钮路径不需要手动 storage settings 即可请求 Chrome 图片下载。
- 重新加载已构建扩展后的真实 Reddit 手动复测仍待完成，尤其要确认 visible count 大于初始 DOM 图片数的多图 gallery 帖子。
- 此前误触发的额外下载文件不属于代码修复范围。
- 尚无 download history persistence。
- Video 与 GIF-style downloads 当前会被有意跳过；`v.redd.it` 仍只是 best-effort extraction，尚无真实视频下载路径、HLS/DASH parsing、audio discovery、audio/video merging、ffmpeg 或 native helper。
- 重新加载已构建的 `dist/` 后，仍需在 Chrome 中进行目视确认。

## Verification Status

- `npm test` passed.
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed for same-baseline action-shell placement, fallback bottom-right placement, and idempotent re-injection.
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed for image-only Chrome download requests and non-image skip warnings.
- `npm exec tsx -- tests/reddit-extractor.test.ts` passed for smallest-post detection with multi-post wrappers.
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed for one-click one-post download request behavior.
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed for click-time Reddit gallery JSON completion from 4 DOM images to 15 image jobs, fetch-failure fallback, and unavailable-metadata fallback.
- `npm exec tsx -- tests/download-execution.test.ts` passed for per-request Chrome override and zero-job real-download guard.
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed for unrelated-mutation root rescanning of previously missed media posts.
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed for fast throttled local scans, finite recovery sweeps, and promoted/ad exclusion.
- `npm run typecheck` passed.
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` passed.
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` passed.
- `npm run build` passed and refreshed `dist/`.
- `git diff --check` passed.
- `AGENTS.md` governance rule update completed.
- `AGENTS.md` first-principles bug analysis rule update completed.
- `AGENTS.md` iteration-log append-only rule update completed.

- `npm test` 已通过。
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过，覆盖同排 action-shell 布局、右下角 fallback 布局与幂等补按钮。
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过，覆盖 image-only Chrome download request 与 non-image skip warnings。
- `npm exec tsx -- tests/reddit-extractor.test.ts` 已通过，覆盖 multi-post wrapper 中优先检测最小 post element。
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过，覆盖 one-click one-post download request 行为。
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过，覆盖点击时 Reddit gallery JSON 补全从 4 张 DOM 图片扩展到 15 个 image jobs、fetch 失败 fallback、metadata 不可用 fallback。
- `npm exec tsx -- tests/download-execution.test.ts` 已通过，覆盖 per-request Chrome override 与 zero-job real-download guard。
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过，覆盖通过无关 mutation root rescan 补回此前漏掉的 media post。
- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过，覆盖快速 throttled local scans、有限 recovery sweeps 与 promoted/ad exclusion。
- `npm run typecheck` 已通过。
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` 已通过。
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` 已通过。
- `npm run build` 已通过并刷新 `dist/`。
- `git diff --check` 已通过。
- `AGENTS.md` governance rule update 已完成。
- `AGENTS.md` first-principles bug analysis rule update 已完成。
- `AGENTS.md` iteration-log append-only rule update 已完成。

## Next Recommended Step

Reload the unpacked extension from `dist/` in Chrome and manually retest the Ben10 page. Clicking `Media` on a multi-image gallery post should download all gallery images for that one post only.

在 Chrome 中从 `dist/` 重新加载 unpacked extension，并手动复测 Ben10 页面。点击多图 gallery 帖子的 `Media` 应下载该帖全部 gallery 图片，且只限该帖子。

## Handoff Notes

After changing source files, always run `npm run build` before Chrome retesting. Storage-level real downloads remain gated, but Reddit `Media` button clicks now request Chrome image downloads directly with `requestedMode: "chrome"`.

修改 source files 后，Chrome 复测前必须运行 `npm run build`。Storage-level real downloads 仍有闸门，但 Reddit `Media` 按钮点击现在会通过 `requestedMode: "chrome"` 直接请求 Chrome 图片下载。
