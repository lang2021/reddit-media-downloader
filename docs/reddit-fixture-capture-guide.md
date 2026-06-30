# Reddit Fixture Capture Guide / Reddit Fixture 捕获指南

## Purpose / 目的

Use this guide to add future real Reddit DOM fixtures for extractor validation.

使用本指南为 extractor 验证补充未来的真实 Reddit DOM fixture。

The current files in `tests/fixtures/reddit/` are representative fixtures, not captured production DOM. They are shaped to resemble common Reddit post containers while avoiding private data.

当前 `tests/fixtures/reddit/` 中的文件是 representative fixtures，不是生产页面直接捕获的 DOM。它们模拟常见 Reddit 帖子容器结构，同时避免保存隐私数据。

## Capture Steps / 捕获步骤

1. Open a public Reddit page in the browser.
2. Inspect one post container, such as `shreddit-post`, `article`, or old Reddit `.thing.link`.
3. Copy only that post container's `outerHTML`.
4. Save it under `tests/fixtures/reddit/` with a descriptive filename.
5. Keep the fixture small enough to review.

1. 在浏览器中打开一个公开 Reddit 页面。
2. 检查一个帖子容器，例如 `shreddit-post`、`article` 或旧 Reddit 的 `.thing.link`。
3. 只复制该帖子容器的 `outerHTML`。
4. 使用描述性文件名保存到 `tests/fixtures/reddit/`。
5. 控制 fixture 大小，确保可以人工审阅。

## Safety Rules / 安全规则

- Do not store cookies, tokens, session ids, local account names, or private messages.
- Do not include full page HTML when a single post fragment is enough.
- Remove analytics payloads, logged-in user controls, and personalized recommendations.
- Keep only public post DOM fragments needed for extraction.

- 不要保存 cookies、tokens、session ids、本地账号名或私信内容。
- 单个帖子片段足够时，不要保存完整页面 HTML。
- 移除 analytics payload、登录用户控件和个性化推荐内容。
- 只保留 extraction 所需的公开帖子 DOM 片段。

## Validation / 验证

After adding a fixture, update `tests/reddit-extractor.test.ts`, then run:

添加 fixture 后，更新 `tests/reddit-extractor.test.ts`，然后运行：

```bash
npm test
npm run typecheck
```

