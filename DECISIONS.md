# DECISIONS.md

## 2026/06/30 11:42

Decision: Add minimal local dev dependencies for Reddit extractor verification.

Reason or context: The project had no package or test framework, but Task 2 required fixture checks without live Reddit access. `typescript`, `tsx`, and `jsdom` provide the smallest local path to run TypeScript DOM fixtures.

Expected impact: Future extractor work can run `npm test` for fixture checks and `npm run typecheck` for TypeScript validation.

Status: active

## 2026/06/30 14:58

Decision: Analyze bugs from first principles before choosing fixes.

决策：分析 bug 时先从第一性原理出发，再决定修复方式。

Reason or context: The user requested an explicit project rule so future debugging starts from root causes, system behavior, and constraints instead of immediately patching symptoms.

原因或背景：用户要求加入明确项目规则，使未来 debugging 先从 root causes、system behavior 与 constraints 出发，而不是直接修补表面症状。

Expected impact: Future bug work should trace the real flow, identify the underlying cause, and then apply the smallest fitting fix.

预期影响：未来 bug work 应先追踪真实流程、识别底层原因，再应用最小且合适的修复。

Status: active

## 2026/06/30 12:35

Decision: Adopt a platform-neutral `GenericMediaPostContext` bridge before connecting UI.

决策：在连接 UI 前采用平台无关的 `GenericMediaPostContext` bridge。

Reason or context: TwitterMediaHarvest's reusable downloader boundary ultimately needs URL and filename, but the current content-script and message payloads are X/Twitter-specific. The Reddit bridge should not make reused UI understand Reddit-specific fields.

原因或背景：TwitterMediaHarvest 的可复用 downloader boundary 最终只需要 URL 与 filename，但当前 content-script 与 message payloads 是 X/Twitter-specific。Reddit bridge 不应让复用 UI 理解 Reddit-specific 字段。

Expected impact: Future UI and message work can accept generic media post data first, then map to browser downloads or Aria2 only after dry-run validation.

预期影响：未来 UI 与 message work 可以先接收 generic media post data，并在 dry-run validation 后再映射到 browser downloads 或 Aria2。

Status: active

## 2026/06/30 12:09

Decision: Documentation content should be written bilingually in Chinese and English by default.

Reason or context: The user requested a new `AGENTS.md` rule that document content use both Chinese and English.

Expected impact: Future project documents should include Chinese and English content unless the user explicitly requests another language mode.

Status: active

## 2026/06/30 12:50

Decision: Adopt dry-run injected UI before enabling real browser or Aria2 downloads.

决策：先采用 injected UI dry run，再启用真实 browser 或 Aria2 downloads。

Reason or context: Task 5 needed to validate Reddit post detection, button injection, Reddit-to-generic bridge conversion, and job generation on visible DOM posts without crossing into real download execution or new permissions.

原因或背景：Task 5 需要在当前可见 DOM posts 上验证 Reddit post detection、button injection、Reddit-to-generic bridge conversion 与 job generation，但不能进入真实下载执行或新增下载权限。

Expected impact: Future real-download work should remain behind an explicit feature flag and keep the dry-run UI/test path as the default safety boundary.

预期影响：未来真实下载工作应放在明确 feature flag 后面，并继续保留 dry-run UI/test path 作为默认安全边界。

Status: active

## 2026/06/30 13:27

Decision: Real download execution is gated behind explicit settings, with dry-run as the default mode.

决策：真实下载执行必须由明确 settings 门控，且 dry-run 作为默认模式。

Reason or context: Task 6 introduces side effects through Chrome downloads and optional Aria2 RPC. To avoid accidental downloads, content scripts only send messages and the service worker checks `enableRealDownloads` plus `mode` before executing anything real.

原因或背景：Task 6 引入 Chrome downloads 与可选 Aria2 RPC 这类副作用。为避免意外下载，content scripts 只发送消息，由 service worker 检查 `enableRealDownloads` 与 `mode` 后才执行真实下载。

Expected impact: Future options UI, history, and download execution work must preserve dry-run as the safe default and keep real execution behind explicit settings.

预期影响：未来 options UI、history 与 download execution 工作必须保留 dry-run 作为安全默认值，并继续将真实执行放在明确 settings 后面。

Status: active

## 2026/06/30 14:08

Decision: Reuse mature open-source solutions before implementing custom code.

决策：在实现自定义代码前，优先复用成熟开源方案。

Reason or context: The project should avoid reimplementing solved problems when GitHub, npm, or another trusted open-source ecosystem already provides a mature solution that fits the project's constraints.

原因或背景：当 GitHub、npm 或其他可信开源生态中已有成熟方案且符合项目约束时，项目应避免重复实现已经被解决的问题。

Expected impact: Future planning and implementation work should search for and evaluate mature open-source options before writing custom logic, especially for browser-extension DOM integration, media extraction, and downloader-adjacent utilities.

预期影响：未来 planning 与 implementation work 应在编写自定义逻辑前先搜索并评估成熟开源选项，尤其是 browser-extension DOM integration、media extraction 与 downloader-adjacent utilities。

Status: active
