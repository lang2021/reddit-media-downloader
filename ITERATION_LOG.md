# ITERATION_LOG.md

## 2026/06/30 11:22

Task type: content

Task goal: Produce a practical Reddit DOM-only Media Extractor v0 engineering spec based on the local TwitterMediaHarvest reference architecture.

Changes made:

- Created `docs/reddit-media-extractor-v0-spec.md`.
- Created initial `PROGRESS.md`, `ITERATION_LOG.md`, and `DECISIONS.md` record files required by `AGENTS.md`.
- Documented reusable TwitterMediaHarvest architecture, Reddit-specific replacement logic, DOM-only extraction rules, data contracts, performance strategy, edge cases, and Task 2 module recommendations.

Files changed:

- `docs/reddit-media-extractor-v0-spec.md`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `git diff --check` attempted, but the workspace is not inside a Git repository.
- File existence and line counts verified.
- Fallback whitespace and conflict-marker checks passed.

Status after task:

- v0 extraction spec is ready for Task 2 implementation.

Rationale / 当时判断:

- The project request was explicitly for a spec and implementation blueprint, not code. The narrowest useful output is one detailed Markdown spec plus required project records.
- TwitterMediaHarvest download execution and settings patterns are reusable, but X/Twitter selectors, API/cache flow, transaction-id capture, tweet entities, and tweet media parsing must be replaced for Reddit.

Remaining issues:

- No Reddit implementation or tests exist yet.
- Git verification depends on whether this folder is inside a Git repository.

Next step:

- Implement the Reddit extractor modules and bridge listed in the spec.

Major decision: none

## 2026/06/30 16:46

Task type: content

Task goal: Add an `AGENTS.md` rule that `ITERATION_LOG.md` should not be read unless necessary and should default to append-only updates.

任务目标：在 `AGENTS.md` 中加入规则：非必要不读取 `ITERATION_LOG.md`，默认只做追加更新。

Changes made:

- Updated `AGENTS.md` handoff guidance so recent `ITERATION_LOG.md` entries are read only when necessary.
- Added a general rule in `AGENTS.md` stating that `ITERATION_LOG.md` should not be reread unless needed and should default to append-only updates.
- Updated `PROGRESS.md` to record the new governance rule.
- Appended this log entry without rereading prior `ITERATION_LOG.md` content.

变更内容：

- 更新 `AGENTS.md` 的 handoff guidance，将最近 `ITERATION_LOG.md` 条目的读取改为“仅在必要时”。
- 在 `AGENTS.md` 中增加通用规则：非必要不回读 `ITERATION_LOG.md`，默认只做追加更新。
- 更新 `PROGRESS.md`，记录这条新的治理规则。
- 在不回读既有 `ITERATION_LOG.md` 内容的前提下，直接追加本条日志。

Files changed:

- `AGENTS.md`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `git diff --check` pending after record updates.

验证状态：

- 记录更新后的 `git diff --check` 待执行。

Status after task:

- The project rules now explicitly prefer append-only `ITERATION_LOG.md` updates unless reading it is genuinely necessary.

任务后状态：

- 项目规则现在已明确：除非确有必要，否则 `ITERATION_LOG.md` 采用 append-only 更新，不主动回读。

Rationale / 当时判断:

- The user explicitly wants to reduce unnecessary log rereads. Making that preference a written repo rule is smaller and more reliable than relying on turn-by-turn memory.

判断依据：

- 用户明确希望减少不必要的日志回读。把这个偏好写成仓库规则，比依赖逐轮记忆更小也更稳。

Remaining issues:

- None for the rule change itself.

剩余问题：

- 就这条规则变更本身而言，无额外剩余问题。

Next step:

- Follow the new rule on future turns: only append to `ITERATION_LOG.md` unless a task truly requires reading it.

下一步：

- 在之后的任务中遵守这条新规则：只有任务确实需要时才读取 `ITERATION_LOG.md`，否则只追加。

Major decision: none

## 2026/06/30 16:38

Task type: correction

Task goal: Revert the Reddit `Media` button placement back to the original bottom-right approach after the action-row path remained unsatisfactory on live Reddit.

任务目标：由于 action-row 路径在 live Reddit 页面中的效果仍不理想，将 Reddit `Media` 按钮位置回退到最初的右下角方案。

Changes made:

- Removed the action-row slot path and broader per-post-host placement experiment from `injectRedditDryRunButton()`.
- Restored one stable host path for UI injection: `postElement.querySelector('shreddit-post') ?? postElement`.
- Restored compact pill button styling with absolute bottom-right placement on the chosen host.
- Kept idempotent button injection and existing click/download behavior unchanged.
- Updated UI regression tests back to host-relative bottom-right placement and removed action-row slot / fallback rail expectations.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 从 `injectRedditDryRunButton()` 中移除 action-row 槽位路径和更宽的 per-post-host 位置实验。
- 将 UI 注入宿主恢复为单一路径：`postElement.querySelector('shreddit-post') ?? postElement`。
- 恢复紧凑 pill 按钮样式，并在选定宿主上使用 absolute 右下角定位。
- 保持幂等按钮注入与现有 click/download 行为不变。
- 将 UI 回归测试改回宿主相对的右下角定位，并移除 action-row 槽位 / fallback rail 预期。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/content/reddit-injected-button.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` pending after record update.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。
- 记录更新后的 `git diff --check` 待执行。

Status after task:

- The `Media` button should render again as a compact pill at the detected post host's bottom-right corner.

任务后状态：

- `Media` 按钮现在应重新以紧凑 pill 的形式渲染在检测到的帖子宿主右下角。

Rationale / 当时判断:

- The action-row approach kept costing complexity without producing the desired live result. Returning to the earlier bottom-right host-relative placement is the smaller and more predictable fix.

判断依据：

- action-row 路径持续增加复杂度，但没有带来理想的 live 效果。回到更早的右下角宿主相对定位，是更小且更可预测的修复。

Remaining issues:

- Manual Chrome retest is still required after reloading `dist/`.
- This only changes button placement; observer coverage and download execution remain unchanged.

剩余问题：

- 重新加载 `dist/` 后，仍需在 Chrome 中手动复测。
- 本次只改变按钮位置；observer coverage 和 download execution 不变。

Next step:

- Reload the unpacked extension from `dist/` and visually confirm the button is back at the post bottom-right corner.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并目视确认按钮已经回到帖子右下角。

Major decision: none

## 2026/06/30 16:29

Task type: correction

Task goal: Fix Reddit `Media` button placement by resolving the full per-post host before searching for the native action row.

任务目标：修复 Reddit `Media` 按钮位置问题，在查找原生 action row 前先解析完整的 per-post host。

Changes made:

- Added per-post host resolution in `injectRedditDryRunButton()` so UI placement no longer searches only inside the detected post node.
- Switched existing-button detection to the resolved post host, preventing duplicate button insertion when the button lives outside the original `postElement`.
- Kept the native action-row path as the primary branch, but now resolve that row from the broader post host and append the button into a dedicated right-side slot.
- Replaced direct root fallback append with a post-scoped right-aligned fallback rail inside the same post host.
- Updated the real-shape fixture so the action row is a sibling of `shreddit-post` under the same outer article.
- Updated UI regression tests for sibling action-row insertion, broader host lookup, and fallback rail placement.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 在 `injectRedditDryRunButton()` 中加入 per-post host 解析，不再只在检测到的 post node 内查找 UI 插入位置。
- 将“已有按钮检测”切换到解析后的 post host，避免按钮位于原始 `postElement` 外层时重复注入。
- 保留原生 action-row 路径作为主分支，但现在改为从更宽的 post host 中解析该 row，并把按钮追加到独立右侧槽位。
- 将直接 append 到 root 的 fallback 替换为同一帖子容器内的右对齐 fallback rail。
- 更新真实形状 fixture，使 action row 成为同一外层 article 下 `shreddit-post` 的 sibling。
- 更新 UI 回归测试，覆盖 sibling action-row 插入、更宽 host lookup 与 fallback rail placement。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/content/reddit-injected-button.ts`
- `tests/fixtures/reddit/real-captured/real-new-gallery-lazy-buttons.html`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。
- `git diff --check` 已通过。

Status after task:

- Button placement now resolves against the broader post container and remains post-scoped in both the action-row path and fallback path.

任务后状态：

- 按钮位置现在会基于更宽的帖子容器解析；无论走 action-row 路径还是 fallback 路径，都保持在同帖范围内。

Rationale / 当时判断:

- The failure was not just alignment styling; the real issue was that the visible action row could live outside the detected `postElement`. Fixing host resolution once is smaller and safer than layering more CSS onto the wrong DOM target.

判断依据：

- 这次失败不只是对齐样式问题；真正的问题是可见 action row 可能位于检测到的 `postElement` 之外。一次性修正 host resolution，比继续往错误 DOM 目标上叠 CSS 更小也更稳。

Remaining issues:

- Manual Chrome retest is still required to confirm the live Reddit DOM exposes a per-post host that matches this fixture shape closely enough.
- This task only changes UI host resolution and placement; observer coverage and download execution remain unchanged.

剩余问题：

- 仍需在 Chrome 中手动复测，以确认真实 Reddit DOM 暴露出的 per-post host 与当前 fixture 形状足够接近。
- 本次只改变 UI host resolution 与 placement；observer coverage 和 download execution 不变。

Next step:

- Reload the unpacked extension from `dist/` and confirm the `Media` button lands in the same post's action row or local fallback rail instead of drifting above the row.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并确认 `Media` 按钮会落到同帖的 action row 或本地 fallback rail，而不是漂到该行上方。

Major decision: none

## 2026/06/30 16:14

Task type: correction

Task goal: Fix the Reddit `Media` button so it stays on the same horizontal action row and lands at the far right instead of appearing above or left-aligned.

任务目标：修复 Reddit `Media` 按钮的位置，使其与原生 action row 保持同一横排，并落在最右侧，而不是出现在上方或左侧。

Changes made:

- Replaced direct action-row append with a dedicated right-side slot wrapper inside `[aria-label="Actions available for this post"]`.
- Applied inline flex styling to the action row at injection time so the native controls and injected slot share one horizontal layout.
- Kept the injected button as a compact pill, but removed its own `margin-left:auto` in the action-row path so the slot owns the right push.
- Upgraded the real-shape Reddit fixture to include vote, comments, award, and share controls instead of an empty action row.
- Updated UI regression assertions to verify action-row flex layout, right-side slot creation, and button insertion into that slot.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 不再把按钮直接 append 到 action row，而是在 `[aria-label="Actions available for this post"]` 内创建独立的右侧槽位 wrapper。
- 在注入时为 action row 补充 inline flex 样式，使原生 controls 与注入槽位共用同一横向布局。
- 保留紧凑 pill 按钮样式，但在 action-row 分支中移除按钮自身的 `margin-left:auto`，改由槽位负责将按钮推到最右侧。
- 将真实形状 Reddit fixture 从空 action row 升级为包含 vote、comments、award 与 share controls 的结构。
- 更新 UI 回归断言，验证 action-row flex 布局、右侧槽位创建，以及按钮插入到该槽位中。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/content/reddit-injected-button.ts`
- `tests/fixtures/reddit/real-captured/real-new-gallery-lazy-buttons.html`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。
- `git diff --check` 已通过。

Status after task:

- The `Media` button now injects into a dedicated right-side action-row slot in fixtures and built output; real Chrome retesting is still required.

任务后状态：

- `Media` 按钮现已在 fixture 与构建产物中注入到 action row 的独立右侧槽位；仍需在真实 Chrome 页面中复测。

Rationale / 当时判断:

- The prior fix assumed Reddit's action row was already the correct horizontal layout container, but the test fixture was too empty to prove that. Giving the action row an explicit flex layout plus a right-side slot is the smallest fix that matches the real accessibility tree shown in Chrome.

判断依据：

- 上一版修复默认认为 Reddit 的 action row 本身已经是正确的横向布局容器，但测试 fixture 过于空洞，无法证明这一点。为 action row 明确补上 flex 布局并增加右侧槽位，是当前与 Chrome 中真实可访问性结构最一致的最小修复。

Remaining issues:

- Chrome manual retesting is still needed to confirm the live Reddit DOM accepts the injected flex styling without side effects.
- This task only changes UI placement and test realism; it does not change observer coverage or download execution.

剩余问题：

- 仍需进行 Chrome 手动复测，以确认真实 Reddit DOM 接受注入的 flex 样式且没有副作用。
- 本次仅修改 UI 位置与测试真实性，不改变 observer coverage 或 download execution。

Next step:

- Reload the unpacked extension from `dist/` and visually confirm the `Media` button sits on the same row as Share and stays at the far right.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并目视确认 `Media` 按钮与 Share 处于同一横排且固定在最右侧。

Major decision: none

## 2026/06/30 16:07

Task type: correction

Task goal: Put the injected Reddit `Media` button back into the native action row, pinned to the far right, with the same size as the other row buttons.

任务目标：将注入的 Reddit `Media` 按钮放回原生 action row，固定到最右侧，并与同排按钮保持相同尺寸。

Changes made:

- Switched `injectRedditDryRunButton()` back to the native `[aria-label="Actions available for this post"]` row when available.
- Removed absolute positioning and used `margin-left: auto` plus inline-flex sizing so the button sits at the far right of the action row.
- Kept the compact pill style and matched the button height to neighboring row controls.
- Updated regression assertions for action-row placement, rightmost alignment, and same-size styling.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 将 `injectRedditDryRunButton()` 改回优先使用原生 `[aria-label="Actions available for this post"]` 行。
- 移除绝对定位，改用 `margin-left: auto` 和 inline-flex sizing，让按钮位于 action row 最右侧。
- 保留 compact pill 样式，并将按钮高度调整为和相邻 row controls 一致。
- 更新回归断言，覆盖 action-row placement、rightmost alignment 与 same-size styling。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/content/reddit-injected-button.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。

Status after task:

- The `Media` button should appear in the action row, aligned to the far right, with a size matching the other row buttons.

任务后状态：

- `Media` 按钮应出现在 action row 中，右对齐，并与同排按钮尺寸一致。

Rationale / 当时判断:

- The user explicitly wanted the button in the same row as the other controls, but only after the row itself proved to be the correct visual anchor.

判断依据：

- 用户明确要求按钮与其他控件同排；前提是 row 本身被证明是正确的视觉锚点。

Remaining issues:

- Manual Chrome retest after reloading `dist/` is still required.
- This keeps the button visually integrated, but does not attempt to perfectly clone Reddit's internal button component.

剩余问题：

- 重新加载 `dist/` 后仍需 Chrome 手动复测。
- 本次让按钮在视觉上融入同排，但不尝试完全复刻 Reddit 内部按钮组件。

Next step:

- Reload the unpacked extension from `dist/` and confirm the Media button sits at the far right of the post action row.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并确认 Media 按钮位于 post action row 最右侧。

Major decision: none

## 2026/06/30 13:59

Task type: correction

Task goal: Fix unstable Reddit `Media` button injection caused by lazy loading and virtualized DOM updates.

任务目标：修复由 lazy loading 与 virtualized DOM updates 导致的 Reddit `Media` 按钮注入不稳定。

Changes made:

- Updated `src/reddit/RedditMediaObserver.ts` to notify idempotently whenever a post has extractable media instead of skipping posts by cached media signature.
- Replaced per-schedule root replacement with an accumulated `pendingRoots` set so rapid consecutive mutations do not drop earlier posts.
- Kept duplicate-button prevention in `injectRedditDryRunButton()`, where the real DOM state is checked.
- Added UI regression coverage for button re-injection after removal, accumulated lazy mutations across two posts, and repeated post mutations without duplicate buttons.

变更内容：

- 更新 `src/reddit/RedditMediaObserver.ts`，只要 post 有可提取媒体就幂等通知，不再用 cached media signature 跳过同一 post。
- 将每次 schedule 覆盖 roots 改为累积 `pendingRoots`，避免快速连续 mutation 丢掉较早的 post。
- 继续把 duplicate-button prevention 留在 `injectRedditDryRunButton()`，由真实 DOM 状态决定是否插入。
- 添加 UI 回归覆盖：按钮被移除后自动补回、两个 post 快速 lazy mutation 都能注入、同一 post 多次 mutation 不重复按钮。

Files changed:

- `src/reddit/RedditMediaObserver.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed and refreshed `dist/`.
- `git diff --check` passed.
- `npm test` passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过并刷新 `dist/`。
- `git diff --check` 已通过。
- `npm test` 已通过。

Status after task:

- The observer now follows the same idempotent re-scan posture used by TwitterMediaHarvest and the referenced GitHub userscript pattern, without copying their downloader logic.

任务后状态：

- observer 现在采用与 TwitterMediaHarvest 及参考 GitHub userscript 类似的幂等重扫姿态，但未复制其下载逻辑。

Rationale / 当时判断:

- Live Reddit inspection showed media posts with extractable URLs but missing buttons, which pointed to DOM-state drift rather than media extraction failure.
- Checking the live DOM for an existing button is safer than treating a cached media signature as proof that UI is still present.

判断依据：

- 真实 Reddit 页面检查显示，缺按钮的媒体帖已有可提取 URL，因此问题更像 DOM 状态漂移，而不是 media extraction failure。
- 以真实 DOM 上是否已有按钮为准，比用 cached media signature 证明 UI 仍存在更安全。

Remaining issues:

- Manual Chrome reload and visual confirmation are still required.
- ShadowRoot injection remains a later fallback only if light DOM anchoring is still unstable.

剩余问题：

- 仍需在 Chrome 中重新加载扩展并目视确认。
- ShadowRoot injection 仅作为 light DOM anchoring 仍不稳定时的后续 fallback。

Next step:

- Reload the unpacked extension from `dist/` and retest the Ben10 page while scrolling.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并在 Ben10 页面滚动复测。

Major decision: none

## 2026/06/30 13:48

Task type: correction

Task goal: Move the injected Reddit `Media` button to the bottom-right corner of each post.

任务目标：将注入的 Reddit `Media` 按钮移动到每个帖子的右下角。

Changes made:

- Updated `src/content/reddit-injected-button.ts` so the button is appended directly to the post element and positioned absolutely at `right: 12px; bottom: 12px`.
- Removed the action-bar / credit-bar target search from button injection.
- Updated `tests/reddit-ui-dry-run.test.ts` to assert the button is a direct post child with bottom-right absolute positioning.

变更内容：

- 更新 `src/content/reddit-injected-button.ts`，让按钮直接 append 到 post element，并用 `right: 12px; bottom: 12px` 绝对定位。
- 移除按钮注入中的 action-bar / credit-bar target search。
- 更新 `tests/reddit-ui-dry-run.test.ts`，断言按钮是 post 的直接子元素，并使用右下角绝对定位。

Files changed:

- `src/content/reddit-injected-button.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed and refreshed `dist/`.
- `git diff --check` passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过并刷新 `dist/`。
- `git diff --check` 已通过。

Status after task:

- Button placement is corrected in source and covered by a focused regression assertion.

任务后状态：

- 按钮位置已在源码中修正，并有聚焦回归断言覆盖。

Rationale / 当时判断:

- The user requested a visual placement change only; direct post-level absolute positioning is smaller and less brittle than continuing to chase Reddit's action-bar DOM variants.

判断依据：

- 用户只要求视觉位置变化；直接使用 post-level absolute positioning 比继续追 Reddit action-bar DOM 变体更小且更稳。

Remaining issues:

- Manual Chrome reload and visual confirmation remain pending.

剩余问题：

- 仍需在 Chrome 中重新加载扩展并目视确认。

Next step:

- Reload the extension in Chrome and confirm the `Media` button appears at the bottom-right of visible posts.

下一步：

- 在 Chrome 中重新加载扩展，并确认 `Media` 按钮出现在可见帖子的右下角。

Major decision: none

## 2026/06/30 12:35

Task type: implementation

Task goal: Build the Reddit to existing UI bridge boundary with platform-neutral data types and dry-run validation.

任务目标：构建 Reddit 到 existing UI 的 bridge boundary，使用平台无关数据类型并进行 dry-run 验证。

Changes made:

- Inspected TwitterMediaHarvest media models, button/message payloads, service worker routing, browser downloads, Aria2 dispatch, and filename settings.
- Added `src/bridge/generic-media-types.ts`.
- Added `src/bridge/reddit-to-generic-media.ts`.
- Added `src/bridge/generic-download-jobs.ts`.
- Added `src/bridge/DryRunMediaBridge.ts`.
- Refactored `src/reddit/reddit-to-download-jobs.ts` to keep the old export while delegating through the generic job builder.
- Added `scripts/reddit-bridge-probe.ts` and `npm run probe:bridge`.
- Added `tests/reddit-bridge.test.ts`.
- Added bilingual docs: `docs/reddit-ui-bridge-contract.md` and `docs/twittermediaharvest-ui-bridge-audit.md`.

变更内容：

- 重新审计 TwitterMediaHarvest 的 media models、button/message payloads、service worker routing、browser downloads、Aria2 dispatch 与 filename settings。
- 添加 `src/bridge/generic-media-types.ts`。
- 添加 `src/bridge/reddit-to-generic-media.ts`。
- 添加 `src/bridge/generic-download-jobs.ts`。
- 添加 `src/bridge/DryRunMediaBridge.ts`。
- 重构 `src/reddit/reddit-to-download-jobs.ts`，保留旧导出，同时通过 generic job builder 执行。
- 添加 `scripts/reddit-bridge-probe.ts` 与 `npm run probe:bridge`。
- 添加 `tests/reddit-bridge.test.ts`。
- 添加双语文档：`docs/reddit-ui-bridge-contract.md` 与 `docs/twittermediaharvest-ui-bridge-audit.md`。

Files changed:

- `package.json`
- `tsconfig.json`
- `docs/reddit-ui-bridge-contract.md`
- `docs/twittermediaharvest-ui-bridge-audit.md`
- `scripts/reddit-bridge-probe.ts`
- `src/bridge/generic-media-types.ts`
- `src/bridge/reddit-to-generic-media.ts`
- `src/bridge/generic-download-jobs.ts`
- `src/bridge/DryRunMediaBridge.ts`
- `src/reddit/reddit-to-download-jobs.ts`
- `tests/reddit-bridge.test.ts`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` passed.
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` passed.
- Fallback whitespace and conflict-marker checks passed.
- Fixture sensitive-text check passed.
- Fixture size check passed; total fixture HTML size is 5028 bytes.
- `git diff --check` attempted, but the workspace is not inside a Git repository.

验证状态：

- `npm test` 已通过。
- `npm run typecheck` 已通过。
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` 已通过。
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` 已通过。
- fallback whitespace 与 conflict-marker checks 已通过。
- fixture sensitive-text check 已通过。
- fixture size check 已通过；fixture HTML 总大小为 5028 bytes。
- 已尝试 `git diff --check`，但当前 workspace 不是 Git repository。

Status after task:

- Reddit bridge boundary is implemented and dry-run validated.

任务后状态：

- Reddit bridge boundary 已实现，并已通过 dry-run 验证。

Rationale / 当时判断:

- TwitterMediaHarvest's final downloader boundary is generic `url` plus `filename`, but its content-script and message payloads are tweet-shaped. A platform-neutral bridge keeps Reddit-specific and X/Twitter-specific fields out of the reusable UI boundary.
- The dry-run bridge gives an integration validation path without enabling UI injection or real downloads.

判断依据：

- TwitterMediaHarvest 的最终 downloader boundary 是通用的 `url` + `filename`，但 content-script 与 message payloads 仍是 tweet-shaped。平台无关 bridge 可以阻止 Reddit-specific 与 X/Twitter-specific 字段泄漏到 reusable UI boundary。
- dry-run bridge 提供了 integration validation 路径，同时不启用 UI injection 或真实下载。

Remaining issues:

- No injected UI dry run yet.
- No service worker message contract for generic media yet.
- No real Chrome downloads or Aria2 execution yet.
- Fixtures are representative, not captured production Reddit DOM.
- Git verification still requires a Git repository.

剩余问题：

- 尚无 injected UI dry run。
- 尚无 generic media 的 service worker message contract。
- 尚未启用真实 Chrome downloads 或 Aria2 execution。
- fixtures 仍是 representative，不是捕获的 production Reddit DOM。
- Git verification 仍需要 Git repository。

Next step:

- Task 5: Wire Reddit bridge into injected UI dry run, while keeping download execution fake/dry-run only.

下一步：

- Task 5：将 Reddit bridge 接入 injected UI dry run，同时继续保持 download execution 为 fake/dry-run only。

Major decision: adopted platform-neutral `GenericMediaPostContext` bridge; see `DECISIONS.md`.

## 2026/06/30 11:42

Task type: implementation

Task goal: Build the first Reddit DOM-only media extractor skeleton from the Task 1 spec.

Changes made:

- Added core Reddit types, post detection, media extraction, URL normalization, video extraction, download-job mapping, and observer skeleton modules.
- Added fixture-based verification with JSDOM.
- Added minimal local TypeScript/tsx/jsdom dev setup.
- Kept UI injection, service worker download execution, Chrome downloads, Aria2 dispatch, Reddit APIs, network interception, and video merging out of scope.

Files changed:

- `.gitignore`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `src/reddit/reddit-types.ts`
- `src/reddit/reddit-post-detector.ts`
- `src/reddit/reddit-media-extractor.ts`
- `src/reddit/reddit-url-normalizer.ts`
- `src/reddit/reddit-video-extractor.ts`
- `src/reddit/reddit-to-download-jobs.ts`
- `src/reddit/RedditMediaObserver.ts`
- `tests/reddit-extractor.test.ts`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `npm test` passed.
- `npm run typecheck` passed.
- `git diff --check` attempted, but the workspace is not inside a Git repository.
- Fallback whitespace and conflict-marker checks passed.

Status after task:

- Reddit extractor skeleton is implemented and fixture-verified.

Rationale / 当时判断:

- The project had no runnable code framework. A minimal `typescript` + `tsx` + `jsdom` setup is the smallest practical way to verify DOM extraction without live Reddit access or browser UI work.
- Gallery extraction stays inside `reddit-media-extractor.ts` for now, matching the spec's lazy split guidance.

Remaining issues:

- Extractor has only synthetic fixture coverage, not saved real Reddit DOM samples.
- Observer only reports contexts through a callback and does not inject UI.
- Unsupported `v.redd.it` HLS/DASH/audio-merge cases are intentionally represented as unsupported.
- Git verification depends on whether this folder is inside a Git repository.

Next step:

- Task 3: add a bridge/message boundary or real Reddit DOM fixtures before adding UI injection.

Major decision: added local dev dependencies for DOM fixture verification; see `DECISIONS.md`.

## 2026/06/30 12:09

Task type: correction

Task goal: Add a rule to `AGENTS.md` requiring documentation content to be written in Chinese and English.

Changes made:

- Added a bilingual documentation rule to the `General Rules` section of `AGENTS.md`.
- Updated `PROGRESS.md` current state and handoff notes.
- Appended this task entry to `ITERATION_LOG.md`.
- Appended a major decision entry to `DECISIONS.md` because the record/documentation rule set changed.

Files changed:

- `AGENTS.md`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `git diff --check` attempted, but the workspace is not inside a Git repository.
- Fallback whitespace and conflict-marker checks passed.

Status after task:

- Documentation should now be bilingual Chinese/English by default unless the user requests otherwise.

Rationale / 当时判断:

- The user explicitly requested a new rule in `AGENTS.md`. Because `AGENTS.md` controls project documentation behavior, this is a record-rule change and should be reflected in `DECISIONS.md`.

Remaining issues:

- None.

Next step:

- Apply the bilingual rule to future project documentation.

Major decision: bilingual documentation rule added; see `DECISIONS.md`.

## 2026/06/30 12:20

Task type: implementation

Task goal: Validate and harden the Reddit DOM extractor with representative Reddit DOM fixtures and a development probe.

任务目标：使用 representative Reddit DOM fixtures 与 development probe 验证并加固 Reddit DOM extractor。

Changes made:

- Added representative Reddit fixture files under `tests/fixtures/reddit/`.
- Added bilingual fixture capture guide at `docs/reddit-fixture-capture-guide.md`.
- Reworked extractor tests to load fixture files and verify image, gallery, video, old Reddit, non-media, avatar/icon filtering, duplicate dedupe, unsupported video, probe output, fixture size, and fixture sensitive-text safety.
- Added `src/reddit/RedditMediaProbe.ts` and `scripts/reddit-fixture-probe.ts`.
- Added `npm run probe:fixture`.
- Hardened extractor logic for nested post candidate dedupe, metadata aliases, picture fallback dedupe, local JSON URL extraction, source host classification, DOM order preservation, thumbnail/avatar/icon filtering, duplicate media identity, and video poster warnings.

变更内容：

- 在 `tests/fixtures/reddit/` 添加 representative Reddit fixture files。
- 添加双语 fixture 捕获指南 `docs/reddit-fixture-capture-guide.md`。
- 将 extractor tests 改为读取 fixture files，并覆盖 image、gallery、video、old Reddit、non-media、avatar/icon filtering、duplicate dedupe、unsupported video、probe output、fixture size 与 fixture sensitive-text safety。
- 添加 `src/reddit/RedditMediaProbe.ts` 与 `scripts/reddit-fixture-probe.ts`。
- 添加 `npm run probe:fixture`。
- 加固 nested post candidate dedupe、metadata aliases、picture fallback dedupe、local JSON URL extraction、source host classification、DOM order preservation、thumbnail/avatar/icon filtering、duplicate media identity 与 video poster warnings。

Files changed:

- `package.json`
- `docs/reddit-fixture-capture-guide.md`
- `src/reddit/RedditMediaProbe.ts`
- `src/reddit/reddit-types.ts`
- `src/reddit/reddit-post-detector.ts`
- `src/reddit/reddit-media-extractor.ts`
- `src/reddit/reddit-url-normalizer.ts`
- `src/reddit/reddit-video-extractor.ts`
- `scripts/reddit-fixture-probe.ts`
- `tests/reddit-extractor.test.ts`
- `tests/fixtures/reddit/avatar-icon-filtering.html`
- `tests/fixtures/reddit/duplicate-media-post.html`
- `tests/fixtures/reddit/new-gallery-post.html`
- `tests/fixtures/reddit/new-image-post.html`
- `tests/fixtures/reddit/new-video-post.html`
- `tests/fixtures/reddit/non-media-post.html`
- `tests/fixtures/reddit/old-image-post.html`
- `tests/fixtures/reddit/unsupported-video-post.html`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` passed.
- Fixture sensitive-text check passed for fixture files.
- Fixture size check passed; total fixture HTML size is 5028 bytes.
- `git diff --check` attempted, but the workspace is not inside a Git repository.

验证状态：

- `npm test` 已通过。
- `npm run typecheck` 已通过。
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` 已通过。
- fixture files 的敏感文本检查已通过。
- fixture size 检查已通过；fixture HTML 总大小为 5028 bytes。
- 已尝试 `git diff --check`，但当前 workspace 不是 Git repository。

Status after task:

- Extractor is representative-fixture verified and probe-enabled.

任务后状态：

- Extractor 已通过 representative fixture 验证，并已具备 probe 诊断入口。

Rationale / 当时判断:

- Real captured Reddit DOM was not available locally, so representative fixtures were added and clearly documented as non-production captures.
- The probe gives a low-risk path to debug real Reddit pages later without UI injection, downloads, APIs, or network interception.
- Hardening stayed focused on fixture-driven and obvious DOM mismatch issues.

判断依据：

- 本地没有可用的真实 Reddit DOM 捕获文件，因此添加 representative fixtures，并明确记录它们不是 production captures。
- probe 提供了后续在真实 Reddit 页面调试的低风险路径，不注入 UI、不下载、不调用 API、不拦截网络。
- 本次加固只处理 fixture-driven 与明显 DOM mismatch 问题。

Remaining issues:

- No captured production Reddit DOM fixtures yet.
- No UI bridge or download execution yet.
- `v.redd.it` HLS/DASH/audio merge remains intentionally unsupported.
- Git verification still requires a Git repository.

剩余问题：

- 尚无直接捕获的 production Reddit DOM fixtures。
- 尚无 UI bridge 或 download execution。
- `v.redd.it` HLS/DASH/audio merge 仍然刻意不支持。
- Git verification 仍需要 Git repository。

Next step:

- Task 4: Build Reddit to existing UI bridge boundary, without enabling real download execution yet.

下一步：

- Task 4：构建 Reddit 到 existing UI 的 bridge boundary，但暂不启用真实下载执行。

Major decision: none

## 2026/06/30 12:50

Task type: implementation

Task goal: Wire the Reddit bridge into an injected UI dry run without enabling real downloads.

任务目标：将 Reddit bridge 接入 injected UI dry run，但不启用真实下载。

Changes made:

- Added `src/content/reddit-content-script.ts` as the dry-run content script entry.
- Added `src/content/reddit-ui-controller.ts` to connect `RedditMediaObserver`, button injection, extraction, generic bridge conversion, download job generation, dry-run bridge sink, console output, and panel output.
- Added `src/content/reddit-injected-button.ts` for the small per-post `Media` button with duplicate protection.
- Added `src/content/reddit-dry-run-panel.ts` for lightweight click-result display.
- Added minimal dry-run MV3 manifest at `src/manifest.json`.
- Added `scripts/build-extension.ts` and `npm run build` using esbuild to create `dist/`.
- Added `tests/reddit-ui-dry-run.test.ts`.
- Added bilingual manual guide `docs/reddit-ui-dry-run-test-guide.md`.
- Added `dist/` to `.gitignore`.
- Installed/recorded `esbuild` as a dev dependency.

变更内容：

- 添加 `src/content/reddit-content-script.ts` 作为 dry-run content script entry。
- 添加 `src/content/reddit-ui-controller.ts`，连接 `RedditMediaObserver`、button injection、extraction、generic bridge conversion、download job generation、dry-run bridge sink、console output 与 panel output。
- 添加 `src/content/reddit-injected-button.ts`，提供每个帖子的 `Media` 小按钮与 duplicate protection。
- 添加 `src/content/reddit-dry-run-panel.ts`，用于轻量展示点击结果。
- 添加最小 dry-run MV3 manifest：`src/manifest.json`。
- 添加 `scripts/build-extension.ts` 与 `npm run build`，使用 esbuild 创建 `dist/`。
- 添加 `tests/reddit-ui-dry-run.test.ts`。
- 添加双语手测指南 `docs/reddit-ui-dry-run-test-guide.md`。
- 将 `dist/` 添加到 `.gitignore`。
- 安装并记录 `esbuild` dev dependency。

Files changed:

- `.gitignore`
- `package.json`
- `package-lock.json`
- `src/manifest.json`
- `scripts/build-extension.ts`
- `src/content/reddit-content-script.ts`
- `src/content/reddit-ui-controller.ts`
- `src/content/reddit-injected-button.ts`
- `src/content/reddit-dry-run-panel.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `docs/reddit-ui-dry-run-test-guide.md`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` passed.
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` passed.
- `npm run build` passed and generated `dist/`.
- `git diff --check` attempted, but the workspace is not inside a Git repository.
- Fallback trailing-whitespace check passed.
- Fallback conflict-marker check passed.
- Forbidden real download/API code check passed for `src`, `scripts`, `tests`, `package.json`, and `src/manifest.json`.
- Fixture sensitive-text check passed.
- Fixture size check passed; total fixture HTML size is 5028 bytes.
- Manifest permission check passed for `src/manifest.json` and `dist/manifest.json`; no `downloads` permission is present.

验证状态：

- `npm test` 已通过。
- `npm run typecheck` 已通过。
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` 已通过。
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` 已通过。
- `npm run build` 已通过，并生成 `dist/`。
- 已尝试 `git diff --check`，但当前 workspace 不在 Git repository 中。
- fallback trailing-whitespace check 已通过。
- fallback conflict-marker check 已通过。
- 对 `src`、`scripts`、`tests`、`package.json` 与 `src/manifest.json` 的 forbidden real download/API code check 已通过。
- fixture sensitive-text check 已通过。
- fixture size check 已通过；fixture HTML 总大小为 5028 bytes。
- `src/manifest.json` 与 `dist/manifest.json` 的 manifest permission check 已通过；未包含 `downloads` permission。

Status after task:

- The project now has a loadable dry-run MV3 extension that injects a `Media` button for media-bearing Reddit posts and performs only dry-run extraction/job display on click.

任务后状态：

- 项目现在具备可加载的 dry-run MV3 extension，会为含媒体的 Reddit posts 注入 `Media` 按钮，并且点击后只执行 dry-run extraction/job display。

Rationale / 当时判断:

- A dry-run UI is the smallest safe integration step before real Chrome downloads or Aria2 dispatch.
- Keeping manifest permissions minimal prevents accidental privilege expansion during UI validation.
- The dry-run bridge makes UI behavior testable without a service worker or download handler.

判断依据：

- 在真实 Chrome downloads 或 Aria2 dispatch 前，dry-run UI 是最小且安全的集成步骤。
- 保持 manifest permissions 最小化，可以避免 UI validation 阶段意外扩大权限。
- dry-run bridge 让 UI 行为无需 service worker 或 download handler 也能测试。

Remaining issues:

- No production Reddit DOM has been manually validated in a browser yet.
- No real download feature flag or service worker download path exists yet.
- No settings UI, history persistence, or user-selected download mode exists yet.

剩余问题：

- 尚未在浏览器中用 production Reddit DOM 进行人工验证。
- 尚无真实下载 feature flag 或 service worker download path。
- 尚无 settings UI、history persistence 或用户选择下载模式。

Next step:

- Task 6: Enable real download execution behind a feature flag, with dry-run remaining the default.

下一步：

- Task 6：在 feature flag 后启用真实下载执行，同时保持 dry-run 为默认行为。

Major decision: dry-run injected UI adopted before real download execution; see `DECISIONS.md`.

## 2026/06/30 13:27

Task type: implementation

Task goal: Enable real download execution behind an explicit feature flag/settings gate.

任务目标：在明确 feature flag/settings gate 后启用真实下载执行。

Changes made:

- Added `src/settings/download-settings.ts` with `dry-run` as the safe default and `enableRealDownloads: false`.
- Added `src/messages/download-messages.ts` with the platform-neutral `START_MEDIA_DOWNLOAD` request/response contract.
- Added `src/background/service-worker.ts` and `src/background/download-router.ts`.
- Added `src/background/chrome-download-executor.ts` for gated `chrome.downloads.download` execution.
- Added `src/background/aria2-executor.ts` for gated local Aria2 JSON-RPC `aria2.addUri` execution.
- Updated `src/content/reddit-ui-controller.ts` so content script sends jobs to the service worker and does not execute downloads directly.
- Updated `src/content/reddit-dry-run-panel.ts` to display service worker response summaries.
- Updated `src/manifest.json` with service worker, `downloads` and `storage` permissions, and minimal Reddit/local Aria2 host permissions.
- Updated `scripts/build-extension.ts` to emit root-level `reddit-content-script.js` and `service-worker.js` matching manifest references.
- Added `tests/download-execution.test.ts`.
- Updated `tests/reddit-ui-dry-run.test.ts` for async service-worker-message behavior.
- Added bilingual manual guide `docs/reddit-real-download-test-guide.md`.

变更内容：

- 添加 `src/settings/download-settings.ts`，默认 `dry-run` 且 `enableRealDownloads: false`。
- 添加 `src/messages/download-messages.ts`，定义 platform-neutral `START_MEDIA_DOWNLOAD` request/response contract。
- 添加 `src/background/service-worker.ts` 与 `src/background/download-router.ts`。
- 添加 `src/background/chrome-download-executor.ts`，用于 gated `chrome.downloads.download` execution。
- 添加 `src/background/aria2-executor.ts`，用于 gated local Aria2 JSON-RPC `aria2.addUri` execution。
- 更新 `src/content/reddit-ui-controller.ts`，让 content script 发送 jobs 到 service worker，不直接执行下载。
- 更新 `src/content/reddit-dry-run-panel.ts`，显示 service worker response summaries。
- 更新 `src/manifest.json`，加入 service worker、`downloads` 与 `storage` permissions，以及最小 Reddit/local Aria2 host permissions。
- 更新 `scripts/build-extension.ts`，输出与 manifest 引用一致的根目录 `reddit-content-script.js` 与 `service-worker.js`。
- 添加 `tests/download-execution.test.ts`。
- 更新 `tests/reddit-ui-dry-run.test.ts`，适配 async service-worker-message behavior。
- 添加双语手测指南 `docs/reddit-real-download-test-guide.md`。

Files changed:

- `package.json`
- `scripts/build-extension.ts`
- `src/manifest.json`
- `src/settings/download-settings.ts`
- `src/messages/download-messages.ts`
- `src/background/service-worker.ts`
- `src/background/download-router.ts`
- `src/background/chrome-download-executor.ts`
- `src/background/aria2-executor.ts`
- `src/content/reddit-ui-controller.ts`
- `src/content/reddit-dry-run-panel.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `tests/download-execution.test.ts`
- `docs/reddit-real-download-test-guide.md`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` passed.
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` passed.
- `npm run build` passed.
- Manifest script-file existence check passed for `dist/manifest.json`.
- `git diff --check` attempted, but the workspace is not inside a Git repository.
- Fallback trailing-whitespace check passed.
- Fallback conflict-marker check passed.
- Forbidden Reddit API and `XMLHttpRequest` check passed.
- Content-script direct `chrome.downloads`/Aria2 `fetch` check passed.
- `<all_urls>` permission check passed.
- Secret/token logging check passed.
- Fixture sensitive-text check passed.
- Fixture size check passed; total fixture HTML size is 5028 bytes.

验证状态：

- `npm test` 已通过。
- `npm run typecheck` 已通过。
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` 已通过。
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` 已通过。
- `npm run build` 已通过。
- `dist/manifest.json` 的 manifest script-file existence check 已通过。
- 已尝试 `git diff --check`，但当前 workspace 不在 Git repository 中。
- fallback trailing-whitespace check 已通过。
- fallback conflict-marker check 已通过。
- forbidden Reddit API 与 `XMLHttpRequest` check 已通过。
- content-script direct `chrome.downloads`/Aria2 `fetch` check 已通过。
- `<all_urls>` permission check 已通过。
- secret/token logging check 已通过。
- fixture sensitive-text check 已通过。
- fixture size check 已通过；fixture HTML 总大小为 5028 bytes。

Status after task:

- Service-worker-mediated real download execution exists and is gated by explicit settings. Dry-run remains the default and safe path.

任务后状态：

- 已具备经 service worker 中转的真实下载执行路径，并由明确 settings 门控。Dry-run 仍是默认安全路径。

Rationale / 当时判断:

- The smallest safe implementation is one service worker message route, one settings gate, and two narrow executors.
- No options page was added because manual `chrome.storage.local` setup is enough for Task 6 validation.
- Real download side effects stay out of the content script.

判断依据：

- 最小安全实现是一条 service worker message route、一个 settings gate，以及两个窄 executors。
- 未添加 options page，因为手动 `chrome.storage.local` 设置足以完成 Task 6 validation。
- 真实下载副作用不进入 content script。

Remaining issues:

- Real Reddit page/manual extension validation is still pending.
- No options UI exists for changing settings.
- No download history persistence exists.
- Aria2 support is a direct JSON-RPC v0 path only.

剩余问题：

- 仍待在真实 Reddit 页面手动验证扩展。
- 尚无用于修改 settings 的 options UI。
- 尚无 download history persistence。
- Aria2 support 只是直接 JSON-RPC v0 路径。

Next step:

- Task 7: Manual real-page validation and bug fix pass.

下一步：

- Task 7：真实页面手动验证与 bug fix pass。

Major decision: real downloads gated by explicit settings with dry-run default; see `DECISIONS.md`.

## 2026/06/30 13:43

Task type: correction

Task goal: Fix missing `Media` buttons on currently visible real Reddit lazy-loaded posts.

任务目标：修复真实 Reddit 当前可见 lazy-loaded posts 没有 `Media` 按钮的问题。

Changes made:

- Updated `src/reddit/reddit-post-detector.ts` so a media node used as scan root can resolve its closest Reddit post.
- Prevented page shell elements such as `html`, `body`, `main`, and `shreddit-feed` from being treated as Reddit posts through fallback permalink detection.
- Updated `src/reddit/RedditMediaObserver.ts` so mutation roots also scan the closest post container.
- Updated `src/content/reddit-injected-button.ts` so visible action areas are preferred before falling back to `[slot="credit-bar"]`.
- Added sanitized real-shape fixture `tests/fixtures/reddit/real-captured/real-new-gallery-lazy-buttons.html`.
- Added regression tests for real-shape gallery buttons, root-image post detection, lazy media mutation injection, and ad-post exclusion.

变更内容：

- 更新 `src/reddit/reddit-post-detector.ts`，使作为 scan root 的 media node 可以解析 closest Reddit post。
- 阻止 `html`、`body`、`main` 与 `shreddit-feed` 等页面壳元素通过 fallback permalink detection 被当成 Reddit posts。
- 更新 `src/reddit/RedditMediaObserver.ts`，让 mutation roots 也扫描 closest post container。
- 更新 `src/content/reddit-injected-button.ts`，优先注入到可见 action areas，再 fallback 到 `[slot="credit-bar"]`。
- 添加 sanitized real-shape fixture：`tests/fixtures/reddit/real-captured/real-new-gallery-lazy-buttons.html`。
- 添加 real-shape gallery buttons、root-image post detection、lazy media mutation injection 与 ad-post exclusion 的回归测试。

Files changed:

- `src/reddit/reddit-post-detector.ts`
- `src/reddit/RedditMediaObserver.ts`
- `src/content/reddit-injected-button.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `tests/reddit-extractor.test.ts`
- `tests/fixtures/reddit/real-captured/real-new-gallery-lazy-buttons.html`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` passed.
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` passed.
- `npm run build` passed.
- `git diff --check` attempted, but the workspace is not inside a Git repository.
- Fallback trailing-whitespace check passed.
- Fallback conflict-marker check passed.
- Forbidden Reddit API check passed for `src`, `tests`, `scripts`, and `docs`.
- Content-script direct download/fetch check passed.
- Fixture sensitive-text check passed.
- Fixture size check passed; total fixture HTML size is 7640 bytes.

验证状态：

- `npm test` 已通过。
- `npm run typecheck` 已通过。
- `npm run probe:fixture -- tests/fixtures/reddit/*.html` 已通过。
- `npm run probe:bridge -- tests/fixtures/reddit/*.html` 已通过。
- `npm run build` 已通过。
- 已尝试 `git diff --check`，但当前 workspace 不在 Git repository 中。
- fallback trailing-whitespace check 已通过。
- fallback conflict-marker check 已通过。
- 对 `src`、`tests`、`scripts` 与 `docs` 的 forbidden Reddit API check 已通过。
- content-script direct download/fetch check 已通过。
- fixture sensitive-text check 已通过。
- fixture size check 已通过；fixture HTML 总大小为 7640 bytes。

Status after task:

- The root cause found on the real Ben10 page has a targeted regression fix, and `dist/` has been rebuilt for manual Chrome retesting.

任务后状态：

- 真实 Ben10 页面发现的根因已有针对性回归修复，且 `dist/` 已重新构建，可用于 Chrome 手动复测。

Rationale / 当时判断:

- The missing button was caused by lazy-loaded media mutations not reliably re-scanning the closest post and by page-shell fallback overreach.
- Fixing the shared post detector and observer is smaller and safer than patching individual UI call sites.

判断依据：

- 按钮缺失由 lazy-loaded media mutations 未可靠回扫 closest post，以及 page-shell fallback 过度匹配共同导致。
- 修 shared post detector 与 observer，比在各个 UI 调用点补丁更小且更安全。

Remaining issues:

- The user still needs to reload the unpacked extension and manually retest in their normal Chrome profile.
- Broader manual test matrix across subreddits remains pending.

剩余问题：

- 用户仍需在自己的 Chrome profile 中 reload unpacked extension 并手动复测。
- 跨 subreddit 的更完整手动测试矩阵仍待完成。

Next step:

- Reload the extension from `dist/` and retest the Reddit page that previously lacked visible buttons.

下一步：

- 从 `dist/` 重新加载扩展，并复测之前看不到按钮的 Reddit 页面。

Major decision: none

## 2026/06/30 14:08

Task type: content

Task goal: Add a project rule requiring reuse of mature open-source solutions when available.

任务目标：增加一条项目规则，要求在已有成熟开源方案时优先复用。

Changes made:

- Added a bilingual `AGENTS.md` rule stating that mature GitHub, npm, or trusted open-source ecosystem solutions should be reused directly when they fit project constraints.
- Updated `PROGRESS.md` with the current governance-rule update.
- Added a matching major decision entry to `DECISIONS.md`.

变更内容：

- 在 `AGENTS.md` 中增加双语规则：当 GitHub、npm 或可信开源生态已有成熟方案且符合项目约束时，应优先直接复用。
- 更新 `PROGRESS.md` 当前状态。
- 在 `DECISIONS.md` 中加入对应重大决策记录。

Files changed:

- `AGENTS.md`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `git diff --check` passed.
- Record-file whitespace and conflict-marker check passed.

验证状态：

- `git diff --check` 已通过。
- record-file whitespace 与 conflict-marker check 已通过。

Status after task:

- Project governance now explicitly discourages reimplementing mature existing open-source solutions.

任务后状态：

- 项目治理规则已明确避免重复实现成熟开源方案。

Rationale / 当时判断:

- The user requested the rule after comparing local implementation stability with TwitterMediaHarvest and an existing GitHub Reddit downloader pattern.

判断依据：

- 用户在比较本地实现稳定性、TwitterMediaHarvest 和已有 GitHub Reddit downloader pattern 后要求加入此规则。

Remaining issues:

- none

剩余问题：

- 无

Next step:

- Apply this rule during future implementation planning and code changes.

下一步：

- 后续 implementation planning 与 code changes 中遵守此规则。

Major decision: open-source reuse rule added; see `DECISIONS.md`.

## 2026/06/30 14:58

Task type: content

Task goal: Add a project rule requiring bug analysis to start from first principles.

任务目标：增加一条项目规则，要求分析 bug 时从第一性原理出发。

Changes made:

- Added a bilingual `AGENTS.md` rule stating that bug analysis should start from first principles before choosing a fix.
- Updated `PROGRESS.md` with the current governance-rule update.
- Added a matching major decision entry to `DECISIONS.md`.

变更内容：

- 在 `AGENTS.md` 中增加双语规则：分析 bug 时要先从第一性原理出发，再决定修复方式。
- 更新 `PROGRESS.md` 当前状态。
- 在 `DECISIONS.md` 中加入对应重大决策记录。

Files changed:

- `AGENTS.md`
- `PROGRESS.md`
- `ITERATION_LOG.md`
- `DECISIONS.md`

Verification status:

- `git diff --check` passed.
- Record-file whitespace and conflict-marker check passed.

验证状态：

- `git diff --check` 已通过。
- record-file whitespace 与 conflict-marker check 已通过。

Status after task:

- Project debugging guidance now explicitly requires first-principles analysis before fixes.

任务后状态：

- 项目 bug 排查规则已明确要求先做第一性原理分析，再决定修复方式。

Rationale / 当时判断:

- The user requested a rule to guide future bug investigations toward root-cause reasoning.

判断依据：

- 用户要求增加规则，以便未来 bug investigation 更偏向 root-cause reasoning。

Remaining issues:

- none

剩余问题：

- 无

Next step:

- Apply this rule during future bug investigation and fixes.

下一步：

- 后续 bug investigation 与 fixes 中遵守此规则。

Major decision: first-principles bug analysis rule added; see `DECISIONS.md`.

## 2026/06/30 15:15

Task type: implementation

Task goal: Diagnose why the visible `Electivire...` Reddit image post had no `Media` button and fix the missed-button path.

任务目标：诊断可见的 `Electivire...` Reddit 图片帖为什么没有 `Media` 按钮，并修复漏按钮路径。

Changes made:

- Inspected the live Chrome DOM for the target post and confirmed it was a normal `i.redd.it` image post with `content-href="https://i.redd.it/wg3jq06iocah1.jpeg"`.
- Verified the local extractor can produce image media items for the same DOM shape, so the failure was not media URL classification.
- Updated `RedditMediaObserver` so each debounced mutation batch rescans the observer root, matching the mature idempotent `addButtons()` strategy used by existing Reddit download-button userscripts.
- Added a regression test where a previously missed media post is recovered by an unrelated later mutation.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 检查当前 Chrome 页面 DOM，确认目标帖子是正常 `i.redd.it` 图片帖，且 `content-href="https://i.redd.it/wg3jq06iocah1.jpeg"`。
- 验证本地 extractor 对同形状 DOM 可以产出 image media items，因此失败点不是媒体 URL 分类。
- 更新 `RedditMediaObserver`，使每个 debounced mutation batch 都重新扫描 observer root，对齐已有 Reddit download-button userscript 的成熟幂等 `addButtons()` 策略。
- 增加回归测试：此前漏掉的 media post 可被后续无关 mutation 触发的 root rescan 补回。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/reddit/RedditMediaObserver.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Record-file and changed-source whitespace/conflict-marker check passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。
- `git diff --check` 已通过。
- record files 与 changed source whitespace/conflict-marker check 已通过。

Status after task:

- The extension should recover missed visible media posts on the next Reddit mutation after the rebuilt `dist/` is reloaded.

任务后状态：

- 重新加载已构建的 `dist/` 后，扩展应能在下一次 Reddit mutation 时补回漏掉的可见 media posts。

Rationale / 当时判断:

- The live DOM had extractable media and nearby posts had buttons, so the bug was isolated to observer/UI notification stability rather than extractor support.

判断依据：

- 现场 DOM 有可提取媒体，附近帖子也已有按钮，因此问题定位在 observer/UI notification stability，而不是 extractor support。

Remaining issues:

- Manual Chrome retest after reloading `dist/` is still required.
- Existing extractor may still over-detect some text posts because unrelated post DOM can contain media-like assets.

剩余问题：

- 重新加载 `dist/` 后仍需进行 Chrome 手动复测。
- 现有 extractor 可能仍会对部分 text posts 过度检测，因为无关 post DOM 中可能含有类似 media 的资源。

Next step:

- Reload the unpacked extension from `dist/` and revisit the Ben10 feed.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并重新检查 Ben10 feed。

Major decision: none

## 2026/06/30 15:24

Task type: implementation

Task goal: Fix the regression where Reddit `Media` buttons became slow and coverage dropped after root rescanning was added.

任务目标：修复加入 root rescanning 后 Reddit `Media` 按钮变慢、覆盖率下降的回归。

Changes made:

- Replaced trailing debounce behavior with a 50ms throttle that accumulates mutation roots without resetting the first scheduled scan.
- Removed per-mutation full observer-root scanning from the fast path.
- Added finite recovery sweeps at startup and one low-frequency mutation-triggered recovery sweep to catch missed posts.
- Added regression coverage for fast local scans under continued mutations and adjusted missed-post recovery coverage to wait for the recovery sweep.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 将 trailing debounce 改为 50ms throttle，累积 mutation roots，但不重置第一次计划扫描。
- 从 fast path 中移除每次 mutation 都全量扫描 observer root 的逻辑。
- 增加启动阶段有限 recovery sweeps，以及低频 mutation-triggered recovery sweep，用于补回漏掉的 posts。
- 增加连续 mutation 下 fast local scans 的回归覆盖，并调整 missed-post recovery 测试等待 recovery sweep。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/reddit/RedditMediaObserver.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Record-file and changed-source whitespace/conflict-marker check passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。
- `git diff --check` 已通过。
- record files 与 changed source whitespace/conflict-marker check 已通过。

Status after task:

- Buttons should appear through fast local mutation scans, while recovery sweeps provide limited missed-post backfill.

任务后状态：

- 按钮应通过快速 local mutation scans 出现，同时 recovery sweeps 提供有限漏帖补回。

Rationale / 当时判断:

- The previous fix made every mutation batch scan the full observer root, which traded correctness for slower visible injection and worse coverage during Reddit's continuous DOM churn.

判断依据：

- 上一版修复让每个 mutation batch 都扫描完整 observer root，在 Reddit 连续 DOM churn 下牺牲了可见注入速度与覆盖率。

Remaining issues:

- Manual Chrome retest after reloading `dist/` is still required.
- Text-post over-detection remains out of scope for this task.

剩余问题：

- 重新加载 `dist/` 后仍需 Chrome 手动复测。
- text-post over-detection 不在本次任务范围内。

Next step:

- Reload the unpacked extension from `dist/` and retest scrolling through the Ben10 feed.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并滚动复测 Ben10 feed。

Major decision: none

## 2026/06/30 15:40

Task type: implementation

Task goal: Align the injected Reddit `Media` button with the native post action row UI.

任务目标：将注入的 Reddit `Media` 按钮与原生 post action row UI 对齐。

Changes made:

- Changed button injection to prefer `[aria-label="Actions available for this post"]`, appending `Media` after the native post action buttons.
- Replaced the previous absolute bottom-right button styling with an inline compact pill style and hover feedback.
- Preserved fallback insertion for posts without an action row, without using floating positioning.
- Added regression assertions for action-row insertion, non-absolute fallback styling, and idempotent injection.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 将按钮注入改为优先使用 `[aria-label="Actions available for this post"]`，把 `Media` 追加到原生 post action buttons 后面。
- 将此前右下角 absolute button 样式替换为 inline compact pill 样式，并增加 hover feedback。
- 保留无 action row 帖子的 fallback 注入，但不再使用悬浮定位。
- 增加 action-row 插入、非 absolute fallback 样式与幂等注入的回归断言。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/content/reddit-injected-button.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。

Status after task:

- The `Media` button should visually sit with Reddit's post action controls when Reddit exposes the action row.

任务后状态：

- 当 Reddit 暴露 post action row 时，`Media` 按钮应在视觉上与 Reddit 原生 post action controls 同排。

Rationale / 当时判断:

- The user wanted visual alignment with the left-side post action controls; moving the existing button into that row was the smallest attempted fix and avoided touching observer or download behavior.

判断依据：

- 用户希望按钮与左侧 post action controls 对齐；将现有按钮移入该行是当时最小尝试修复，并避免触碰 observer 或 download behavior。

Remaining issues:

- Manual Chrome retest showed the button could land above the action row instead of at the desired corner.
- This did not attempt to clone Reddit internal components or shadow DOM.

剩余问题：

- Chrome 手动复测显示按钮可能落到 action row 上方，而不是目标角落。
- 本次不尝试复制 Reddit 内部组件或 shadow DOM。

Next step:

- Move the pill-styled button back to bottom-right placement.

下一步：

- 将 pill 样式按钮移回右下角位置。

Major decision: none

## 2026/06/30 15:48

Task type: correction

Task goal: Move the pill-styled Reddit `Media` button back to the post bottom-right corner after real-page action-row placement looked wrong.

任务目标：真实页面 action-row placement 效果不正确后，将 pill 样式 Reddit `Media` 按钮移回帖子右下角。

Changes made:

- Removed action-row targeting from `injectRedditDryRunButton()`.
- Restored absolute bottom-right placement on the post host while keeping the compact pill visual style.
- Updated UI regression assertions for bottom-right pill placement.
- Rebuilt `dist/` for Chrome retesting.

变更内容：

- 从 `injectRedditDryRunButton()` 移除 action-row targeting。
- 在 post host 上恢复 absolute bottom-right placement，同时保留 compact pill 视觉样式。
- 更新 UI 回归断言，覆盖右下角 pill placement。
- 重新构建 `dist/`，供 Chrome 复测。

Files changed:

- `src/content/reddit-injected-button.ts`
- `tests/reddit-ui-dry-run.test.ts`
- `dist/reddit-content-script.js`
- `PROGRESS.md`
- `ITERATION_LOG.md`

Verification status:

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

验证状态：

- `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` 已通过。
- `npm run typecheck` 已通过。
- `npm run build` 已通过。

Status after task:

- The `Media` button should render as a compact pill at each detected media post's bottom-right corner.

任务后状态：

- `Media` 按钮应以 compact pill 形式渲染在每个已检测媒体帖子的右下角。

Rationale / 当时判断:

- The live Reddit DOM did not place the injected action-row button where expected, so restoring host-relative absolute positioning is the smaller and more predictable fix.

判断依据：

- 真实 Reddit DOM 未将注入的 action-row button 放到预期位置，因此恢复 host-relative absolute positioning 是更小且更可预测的修复。

Remaining issues:

- Manual Chrome retest after reloading `dist/` is still required.
- This only changes button placement and visual style, not observer coverage or download behavior.

剩余问题：

- 重新加载 `dist/` 后仍需 Chrome 手动复测。
- 本次只改变按钮位置与视觉样式，不改变 observer coverage 或 download behavior。

Next step:

- Reload the unpacked extension from `dist/` and visually confirm the button sits at the post bottom-right corner.

下一步：

- 从 `dist/` 重新加载 unpacked extension，并目视确认按钮位于帖子右下角。

Major decision: none

## 2026/06/30 17:03

- Task type: implementation
- Task goal: Replace the fragile bottom-right-only Reddit `Media` button with a same-baseline right-side shell layout when the detected host exposes an action row, while keeping a clickable fallback for posts without one.
- Changes made:
  - Updated `src/content/reddit-injected-button.ts` so the primary path wraps the detected in-host action row in a local flex shell and places the extension `Media` button as a right-side sibling instead of using absolute positioning.
  - Kept the fallback path for posts without an in-host action row, but raised fallback `z-index` so the bottom-right button remains clickable.
  - Expanded `tests/reddit-ui-dry-run.test.ts` to cover shell layout placement, fallback placement, shell/button idempotency, and lazy-action-row injection behavior.
  - Rebuilt `dist/` after the source change.
- Files changed:
  - `src/content/reddit-injected-button.ts`
  - `tests/reddit-ui-dry-run.test.ts`
  - `PROGRESS.md`
- Verification status:
  - `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed
  - `npm run typecheck` passed
  - `npm run build` passed
  - `git diff --check` passed
- Status after task: Primary Reddit button injection now prefers a same-row shell layout inside the detected host and falls back to a higher-priority bottom-right pill when no in-host action row is available.
- Rationale / 当时判断: The previous absolute button could drift to a different visual row and become unclickable under Reddit's layering. A local shell layout keeps the button on the same baseline without modifying Reddit's native button group; fallback remains available for leaner host shapes.
- Remaining issues:
  - Real Chrome verification is still required because some live Reddit shapes may expose the visible action row outside the detected host.
  - `v.redd.it` extraction remains best-effort only.
- Next step: Reload the unpacked extension from `dist/` in Chrome and retest the Ben10 page to confirm same-row alignment and clickability on real posts.
- Major decision: none

## 2026/06/30 17:11

- Task type: implementation
- Task goal: Enable real Reddit image downloads from the existing `Media` button while skipping videos and other non-image media.
- Changes made:
  - Updated `src/content/reddit-ui-controller.ts` so button clicks filter media to images only, add skip warnings for non-image media, and send `requestedMode: "chrome"`.
  - Updated `src/background/download-router.ts` so per-request `requestedMode: "chrome"` uses the existing Chrome downloads executor without changing storage settings.
  - Added a zero-job guard so image-free posts do not report real download execution.
  - Updated `src/content/reddit-injected-button.ts` user-facing title and aria label from dry-run wording to image-download wording.
  - Expanded UI and download execution tests for image-only requests, non-image skip warnings, Chrome override, and zero-job behavior.
  - Rebuilt `dist/`.
- Files changed:
  - `src/content/reddit-ui-controller.ts`
  - `src/background/download-router.ts`
  - `src/content/reddit-injected-button.ts`
  - `tests/reddit-ui-dry-run.test.ts`
  - `tests/download-execution.test.ts`
  - `PROGRESS.md`
- Verification status:
  - `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed
  - `npm exec tsx -- tests/download-execution.test.ts` passed
  - `npm run typecheck` passed
  - `npm run build` passed
  - `git diff --check` passed
- Status after task: Clicking `Media` now requests Chrome downloads for image media only; video-only and unsupported posts show warnings and create no real download jobs.
- Rationale / 当时判断: The project already had a working Chrome downloads executor and message route, so the smallest reliable change was to reuse that path with a per-click Chrome override and image-only filtering.
- Remaining issues:
  - Chrome manual retest after reloading `dist/` is still required.
  - Video, GIF-style media, aria2 UI, download history, and native helper support remain out of scope.
- Next step: Reload the unpacked extension from `dist/` in Chrome and test one image post plus one video-only post on Reddit.
- Major decision: none

## 2026/06/30 23:33

- Task type: correction
- Task goal: Fix the severe over-broad Reddit post detection bug where clicking one post's `Media` button could download images from multiple visible posts.
- Changes made:
  - Updated `src/reddit/reddit-post-detector.ts` so the smallest valid post element wins over containing feed/wrapper elements.
  - Added an extractor regression proving a wrapper with two `shreddit-post` children returns two separate posts and each extracted context contains only its own image.
  - Added a UI/controller regression proving clicking the second post's button sends only that second post's image job.
  - Rebuilt `dist/`.
- Files changed:
  - `src/reddit/reddit-post-detector.ts`
  - `tests/reddit-extractor.test.ts`
  - `tests/reddit-ui-dry-run.test.ts`
  - `PROGRESS.md`
- Verification status:
  - `npm exec tsx -- tests/reddit-extractor.test.ts` passed
  - `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed
  - `npm run typecheck` passed
  - `npm run build` passed
  - `git diff --check` passed
- Status after task: One click should now resolve to one detected Reddit post only; wrapper/feed containers no longer replace nested real post elements.
- Rationale / 当时判断: The root cause was shared post detection scope, not download execution. Fixing `addPost` once is smaller and safer than adding download-side filters around an already over-broad element.
- Remaining issues:
  - Chrome manual retest after reloading `dist/` is still required.
  - Existing accidental extra downloaded files are outside code recovery scope.
- Next step: Reload the unpacked extension from `dist/` and verify one image post click downloads only that post's images.
- Major decision: none

## 2026/06/30 23:49

- Task type: implementation
- Task goal: Fix incomplete Reddit gallery image downloads when Reddit only lazy-loads a subset of gallery images into the DOM.
- Changes made:
  - Added click-time Reddit gallery JSON metadata completion for gallery posts before image-only download job creation.
  - Preserved DOM-only extraction for observer/button detection and kept normal single-image posts on the existing path.
  - Added fallback warnings for gallery metadata fetch failures and unavailable metadata.
  - Added UI/controller regressions covering 4 DOM images expanding to 15 gallery jobs, fetch-failure fallback, and unavailable-metadata fallback.
- Files changed:
  - `src/content/reddit-ui-controller.ts`
  - `tests/reddit-ui-dry-run.test.ts`
  - `PROGRESS.md`
  - `ITERATION_LOG.md`
- Verification status:
  - `npm exec tsx -- tests/reddit-extractor.test.ts` passed.
  - `npm exec tsx -- tests/reddit-ui-dry-run.test.ts` passed.
  - `npm exec tsx -- tests/download-execution.test.ts` passed.
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - `git diff --check` passed.
- Status after task: Clicking `Media` on a lazy-loaded Reddit gallery can now use Reddit JSON metadata to build all image jobs for that one post only.
- Rationale / 当时判断: Pure DOM extraction cannot reliably see images Reddit has not loaded yet; fetching the clicked post's own gallery metadata is the smallest scoped fix that avoids page-wide scanning.
- Remaining issues: Manual Chrome retest after reloading `dist/` is still needed.
- Next step: Reload the unpacked extension from `dist/` and retest a gallery post whose visible count exceeds initially downloaded images.
- Major decision: none

## 2026/06/30 23:52

- Task type: release
- Task goal: Save the current basically complete image-download baseline as a local Git snapshot.
- Changes made:
  - Added `.DS_Store` to `.gitignore` so macOS metadata is not included in the snapshot.
  - Updated `PROGRESS.md` to note the local snapshot preparation.
- Files changed:
  - `.gitignore`
  - `PROGRESS.md`
  - `ITERATION_LOG.md`
- Verification status:
  - `git diff --check` passed before snapshot.
- Status after task: Ready for local Git commit.
- Rationale / 当时判断: The image-only Reddit download path is now functionally complete enough to preserve before the next optimization pass.
- Remaining issues: Manual Chrome retest after reloading `dist/` is still needed.
- Next step: Continue optimization after validating the saved baseline in Chrome.
- Major decision: none
