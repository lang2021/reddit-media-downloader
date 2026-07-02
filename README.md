# Reddit Media Downloader

Browser extension for downloading image media from Reddit posts.

## English

### Overview

Browser extension for downloading image media from Reddit posts.

### What Works

- Injects a compact download button into Reddit media posts
- Downloads image media from supported Reddit post layouts
- Completes lazy gallery image lists at click time from the post's own Reddit JSON
- Saves generated filenames under the relative `reddit_media_harvest/` directory
- Marks a post button as downloaded after a successful real image download

### Current Limitations

- Image download is the supported path for v1
- Video and GIF-style Reddit media are intentionally skipped
- No options page is included yet
- Downloaded state is only a visual indicator and does not prevent repeat downloads

### Build

```sh
npm install
npm run build
```

The build output is written to `dist/`.

### Load In Chrome

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the local `dist/` directory

### Tests

```sh
npm test
npm run typecheck
```

## 中文

### 项目简介

用于下载 Reddit 帖子图片媒体的浏览器扩展。

### 当前可用功能

- 会在 Reddit 媒体帖子中注入一个紧凑的下载按钮
- 可下载当前支持的 Reddit 图片帖子
- 对 lazy gallery 帖子会在点击时补全 Reddit 自身 JSON 中的图片列表
- 生成的文件名会放在相对目录 `reddit_media_harvest/` 下
- 真实下载成功后，帖子按钮会显示已下载状态

### 当前限制

- `1.0.0` 版本当前只支持图片下载
- 视频与 GIF 风格的 Reddit 媒体当前会被跳过
- 还没有 options page
- 已下载状态目前只是提示，不会阻止重复下载

### 构建

```sh
npm install
npm run build
```

构建输出会写入 `dist/`。

### 在 Chrome 中加载

1. 打开 `chrome://extensions`
2. 打开开发者模式
3. 点击 `加载已解压的扩展程序`
4. 选择本地 `dist/` 目录

### 测试

```sh
npm test
npm run typecheck
```
