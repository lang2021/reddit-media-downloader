# Reddit Media Downloader

English | [简体中文](./README.zh-CN.md)

## Overview

Browser extension for downloading image media from Reddit posts.

## What Works

- Injects a compact download button into Reddit media posts
- Downloads image media from supported Reddit post layouts
- Completes lazy gallery image lists at click time from the post's own Reddit JSON
- Saves generated filenames under the relative `reddit_media_harvest/` directory
- Marks a post button as downloaded after a successful real image download

## Current Limitations

- Image download is the supported path for v1
- Video and GIF-style Reddit media are intentionally skipped
- No options page is included yet
- Downloaded state is only a visual indicator and does not prevent repeat downloads

## Build

```sh
npm install
npm run build
```

The build output is written to `dist/`.

## Load In Chrome

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the local `dist/` directory

## Tests

```sh
npm test
npm run typecheck
```
