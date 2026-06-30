# Reddit DOM-Only Media Extractor v0 Spec

## 1. Repository Audit Summary

This spec is for a new Reddit media downloader extension in `/Users/marsdrifter/My_Digital_Vault/01_Work_Projects/01_Code/01_Active/Reddit Media Downloader`.

The local Reddit workspace currently contains only `AGENTS.md`, so the implementation should start from a small, Reddit-specific extraction layer and adapt the proven browser-extension architecture from `/Users/marsdrifter/My_Digital_Vault/01_Work_Projects/01_Code/01_Active/TwitterMediaHarvest`.

TwitterMediaHarvest is a Manifest V3 extension with:

- content scripts that observe social-feed DOM changes and inject a host-styled download button
- service worker message routing
- settings repositories for features, download behavior, and filename rules
- browser downloads integration
- Aria2 external-extension dispatch
- IndexedDB-backed download history and records
- tweet-specific API/cache/media parsing that must not be reused for Reddit v0

For Reddit v0, keep the extension/downloader shape and replace the extraction source with DOM-only Reddit post parsing. Do not use Reddit OAuth, Data API, internal API, network interception, HLS/DASH parsing, ffmpeg, or native helpers.

## 2. Inspected File List

Reference files inspected in TwitterMediaHarvest:

| Area | Files |
| --- | --- |
| Extension shape | `src/manifest.json`, `src/contentScript/main.ts`, `src/serviceWorker/sw.ts` |
| DOM observation and button lifecycle | `src/contentScript/observers/TwitterMediaObserver.ts`, `src/contentScript/observers/observer.ts`, `src/contentScript/core/index.ts`, `src/contentScript/core/Harvester.ts` |
| Twitter-specific detection to replace | `src/contentScript/utils/article.ts`, `src/contentScript/utils/checker.ts` |
| Button and message flow | `src/contentScript/utils/button.ts`, `src/libs/webExtMessage/messages/downloadTweetMedia.ts`, `src/libs/webExtMessage/messages/checkDownloadHistory.ts`, `src/libs/webExtMessage/sendMessage.ts` |
| Service worker routing | `src/serviceWorker/initMessageRouter.ts`, `src/serviceWorker/messageRouter.ts`, `src/serviceWorker/messageHandlers/downloadMediaHandler.ts` |
| Download execution | `src/domain/valueObjects/downloadTarget.ts`, `src/domain/valueObjects/downloadConfig.ts`, `src/domain/useCases/downloadMediaFile.ts`, `src/infra/useCases/browserDownloadMediaFile.ts`, `src/infra/useCases/aria2DownloadMediaFile.ts` |
| Filename/settings/history context | `src/domain/valueObjects/filenameSetting.ts`, `src/enums/patternToken.ts`, `src/infra/repositories/downloadSettings.ts`, `src/infra/repositories/filenameSettings.ts`, `src/types/schema.d.ts`, `src/pages/components/GeneralOptions.tsx`, `src/pages/components/FeatureOptions.tsx`, `src/pages/components/IntegrationOptions.tsx` |
| Twitter media pipeline to bypass or replace | `src/applicationUseCases/downloadTweetMedia.ts`, `src/domain/factories/tweetToTweetMediaFiles.ts`, `src/domain/valueObjects/tweet.ts`, `src/domain/valueObjects/tweetMedia.ts`, `src/domain/valueObjects/tweetMediaFile.ts` |

## 3. Reusable Architecture From TwitterMediaHarvest

Reuse these patterns:

- Manifest V3 content script plus service worker structure from `src/manifest.json`.
- Content script startup flow from `src/contentScript/main.ts`: load feature settings, choose an observer, observe the page, and initialize on focus/navigation-like changes.
- MutationObserver wrapper pattern from `src/contentScript/observers/observer.ts`, including element-level observed markers.
- Observer/button lifecycle from `TwitterMediaObserver`, `core/index.ts`, and `core/Harvester.ts`: detect media-bearing post containers, mark the target container, avoid duplicate buttons, and refresh button state.
- Host-styled button approach from `core/Harvester.ts`: clone a native action button when possible, replace the icon, wrap it in a `.harvester` element, and attach a listener.
- Runtime message wrapper and service worker routing from `sendMessage.ts`, `messageRouter.ts`, and `initMessageRouter.ts`.
- Download target abstraction from `DownloadTarget` and `DownloadConfig`.
- Browser downloads path from `BrowserDownloadMediaFile`.
- Aria2 external message path from `Aria2DownloadMediaFile`, with Reddit referrer replacing the X status URL.
- Existing settings concepts: `enableAria2`, `askWhereToSave`, `autoRevealNsfw`, `includeVideoThumbnail`, and filename pattern settings.

## 4. Parts Requiring Reddit Adaptation

Adapt these, do not copy literally:

- `TwitterMediaObserver` should become `RedditMediaObserver` with Reddit post selectors and Reddit lazy-load rechecks.
- `makeHarvestButton` can keep the host-button cloning pattern, but Reddit action bars differ across new Reddit, old Reddit, feed pages, and detail pages.
- Button click handling should send a generic or Reddit-specific download message carrying a `RedditMediaContext`, not `tweetId` and `screenName`.
- Download history checks should use `postId` or `platform:postId`, not `tweetId`.
- Filename settings should expose Reddit terms in the UI later, but v0 can map `{account}` to `author`, `{tweetId}` to `postId`, and `{serial}` to `index` internally until a generic token UI is worth doing.
- `includeVideoThumbnail` should only allow explicit poster fallback when the extracted item is marked as poster/thumbnail; it must not silently turn unsupported videos into image downloads.

## 5. Parts To Replace Entirely

Replace these Twitter-specific assumptions:

- X/Twitter host checks and path rules from `checker.ts`.
- Tweet article selectors, status links, photo-mode assumptions, quoted-content filters, and media checks from `article.ts`.
- Twitter API/cache/transaction-id capture flow in `contentScript/main.ts`, `downloadMediaHandler.ts`, and `DownloadTweetMedia`.
- Tweet entities and media value objects: `Tweet`, `TweetMedia`, `TweetMediaFile`, and `TweetInfo`.
- `tweetToAvailableTweetMediaFiles` and Twitter media URL variant logic.
- X referrer construction in `Aria2DownloadMediaFile`.
- X/Twitter content script host permissions and CSP image/connect targets.

## 6. Reddit Post Detection Selector Map

The detector accepts a root element and returns candidate post containers.

| Reddit surface | Primary selector or signal | Post id source |
| --- | --- | --- |
| New Reddit custom element | `shreddit-post` | `id`, `post-id`, `data-post-id`, `permalink`, or child permalink |
| New Reddit article | `article` with a post permalink or media-bearing child | permalink `/comments/{postId}/` or descendant `data-post-id` |
| Generic new Reddit | `[data-post-id]` | `data-post-id` |
| Old Reddit | `.thing.link`, `.thing[id^="thing_t3_"]`, `[data-fullname^="t3_"]` | `data-fullname`, `id="thing_t3_xxx"`, or permalink |
| Fallback around media | closest ancestor of image/video/gallery node | inferred only from a Reddit comments permalink |

Detection order:

1. Directly collect `shreddit-post`, `.thing.link`, `.thing[id^="thing_t3_"]`, and `[data-post-id]`.
2. Collect `article` elements that contain a permalink matching `/comments/{postId}/` and at least one media-bearing child.
3. For media nodes not inside a known container, walk up to the nearest ancestor containing a Reddit comments permalink.
4. Reject candidates with no stable `postId`, unless the page is a single post detail page and a permalink can be read from `location.pathname`.
5. Reject promoted containers when they contain ad/promoted labels and no eligible post permalink.

Post id parsing:

```text
/comments/{postId}/
thing_t3_{postId}
t3_{postId}
data-post-id="{postId}"
```

`postFullname` is `t3_${postId}` when available or derivable.

## 7. Reddit Media Detection

Supported media types:

```ts
type MediaType = "image" | "gallery" | "gif" | "video" | "unsupported";
```

Supported source categories:

- `i.redd.it`
- `preview.redd.it`
- `external-preview.redd.it`
- `v.redd.it`
- direct `<img src>`
- direct `<source srcset>`
- direct `<video src>` or `video.currentSrc`
- gallery DOM
- embedded JSON or script data already present inside the post DOM
- outbound `.gif`, `.gifv`, or direct mp4 links visible in the DOM

A post is downloadable when normalization produces at least one supported `RedditMediaItem`. If only unsupported evidence is found, return a context with empty `media` and a warning so the UI can show a disabled or error state.

## 8. Image Extraction Rules

Image extraction runs inside one post container only.

Priority:

1. Direct `i.redd.it` image URLs.
2. Highest-quality `preview.redd.it` or `external-preview.redd.it` URL.
3. Highest-density candidate from `<source srcset>` or `<img srcset>`.
4. Direct `<img src>`.
5. CSS `background-image: url(...)` fallback.

URL rules:

- Decode HTML entities before URL parsing.
- Clean accidental `amp;` fragments in query strings.
- Resolve relative URLs against `location.href`.
- Remove duplicate URLs after canonicalization.
- Preserve useful Reddit preview query parameters when they are required for access, but compare duplicates by origin + pathname + meaningful media parameters.
- Prefer original/direct URLs over thumbnails.
- Infer extension from pathname first, then `format` query parameter, then media type fallback (`.jpg` for still image).

Thumbnail fallback:

- If the only image candidate is a thumbnail, include it with `quality: "thumbnail"` and warning `only_thumbnail_available`.
- Do not download avatars, subreddit icons, awards, emoji, sprites, or tracking pixels as thumbnail fallback.

Filtering rules:

- Reject URLs with obvious UI paths or names: `avatar`, `snoovatar`, `award`, `emoji`, `sprite`, `icon`, `logo`, `tracking`, `pixel`.
- Reject tiny visible images when `naturalWidth` and `naturalHeight` are both below `120`, unless the URL is direct `i.redd.it`.
- Reject images inside author/user/subreddit header blocks when a better post media candidate exists.

## 9. Gallery Extraction Rules

Gallery extraction should flatten gallery items into ordered `RedditMediaItem[]`.

Supported signals:

- `shreddit-gallery`
- visible gallery child images
- child `<img>` nodes inside gallery-like containers
- `srcset` on `<source>` or `<img>`
- DOM attributes containing media URLs or JSON strings
- embedded JSON/script content inside the post container only

Ordering:

1. Prefer visible DOM order.
2. Use gallery item index attributes when present.
3. Fall back to discovery order.

Rules:

- Assign stable zero-based `index` in output order.
- Deduplicate by normalized URL.
- Allow partial success; if item 2 fails but items 1 and 3 succeed, return the successful items and add `gallery_partial_extraction`.
- Do not call Reddit APIs to resolve gallery metadata.
- Do not parse every script on the page. Only parse script/JSON nodes scoped to the post container and only when visible DOM extraction fails or is incomplete.

## 10. GIF/GIFV Extraction Rules

Supported:

- Direct `.gif` image URLs from Reddit-hosted or visible external URLs.
- `.gifv` links when visible in DOM.
- Direct mp4 URL visible near a `.gifv` or animated preview.
- Reddit-hosted animated media represented as a direct image or mp4 candidate.

Priority:

1. If a `.gifv` post has a visible direct mp4 in `<video>`, `<source>`, or nearby anchor attributes, use the mp4 as `type: "gif"` with `ext: ".mp4"`.
2. Else use direct `.gif` URL.
3. Else mark unsupported with `unsupportedReason: "external_gif_adapter_not_supported"`.

Do not add Imgur, Redgifs, Gfycat, or other site-specific adapters in v0.

## 11. Video Extraction Rules

Supported in v0:

- Direct `<video src>`.
- `video.currentSrc` when available.
- Direct `<source src>` with `.mp4`.
- Visible direct mp4 link.
- Visible direct playable `v.redd.it` URL when it is not a manifest.

Not supported in v0:

- `.m3u8`
- `.mpd`
- HLS parsing
- DASH parsing
- audio stream discovery
- audio/video merging
- ffmpeg
- native helper
- authenticated or hidden token reuse

Failure behavior:

- If only a manifest URL is found, return no video media item and add `video_requires_manifest_or_audio_merge`.
- If only a poster image is found, do not treat it as video. If `includeVideoThumbnail` is enabled in a later implementation, it may be surfaced as `type: "image"`, `quality: "thumbnail"`, with warning `video_poster_only`.
- If `v.redd.it` has no direct playable URL in DOM, return unsupported instead of guessing URL variants.

## 12. Normalization Rules

Normalization converts raw candidates into deterministic media items.

Steps:

1. Decode HTML entities.
2. Remove stray `amp;` prefixes from query keys.
3. Resolve relative URLs.
4. Drop invalid URLs.
5. Classify source host.
6. Classify media type from pathname, host, DOM element type, and MIME hints.
7. Infer extension.
8. Score quality.
9. Filter non-post media.
10. Deduplicate.
11. Sort by gallery order, DOM order, then URL.
12. Assign stable zero-based `index`.

Quality preference:

```text
original > preview > thumbnail > unknown
```

Media type classification:

- `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` -> `image`
- `.gif` -> `gif`
- `.gifv` -> `gif` if usable, unsupported otherwise
- `.mp4`, `.webm`, direct `<video>` source -> `video`
- `.m3u8`, `.mpd` -> unsupported warning

Duplicate removal:

- Use normalized absolute URL as the primary key.
- For Reddit preview URLs with repeated encoded forms, decode once and compare origin + pathname + media-relevant params.
- When duplicates differ only by quality, keep the higher-quality candidate.

## 13. Data Model

Core contract:

```ts
type RedditMediaType = "image" | "video" | "gif";
type RedditMediaSource =
  | "i.redd.it"
  | "preview.redd.it"
  | "external-preview.redd.it"
  | "v.redd.it"
  | "dom"
  | "json"
  | "external";

interface RedditMediaItem {
  type: RedditMediaType;
  url: string;
  index: number;
  filenameHint?: string;
  source: RedditMediaSource;
  quality: "original" | "preview" | "thumbnail" | "unknown";
  ext?: string;
  unsupportedReason?: string;
}

interface RedditMediaContext {
  platform: "reddit";
  postId: string;
  postFullname?: string;
  subreddit?: string;
  author?: string;
  title?: string;
  permalink?: string;
  media: RedditMediaItem[];
  warnings: string[];
}
```

Downloader bridge:

```ts
interface RedditToDownloaderBridge {
  extractFromPostElement(postElement: Element): RedditMediaContext | null;
  toDownloadJobs(context: RedditMediaContext): DownloadJob[];
}

interface DownloadJob {
  url: string;
  filename: string;
  mode?: "chrome" | "aria2";
}
```

Filename metadata:

```text
{subreddit}_{author}_{postId}_{index}.{ext}
```

The extractor must provide `subreddit`, `author`, `postId`, `index`, and `ext` when available. Filename generation can stay in the downloader adapter.

## 14. Extraction Pipeline

Pipeline:

```text
scan DOM incrementally
-> detect candidate post containers
-> extract post metadata
-> detect media-bearing nodes
-> extract raw media URLs
-> classify media type
-> normalize URLs
-> remove duplicates
-> filter non-post media
-> build RedditMediaContext
-> return context or unsupported/empty result
```

Input:

- A root `Document`, `Element`, or newly added DOM node.

Output:

- `RedditMediaContext` for a post with supported or unsupported media evidence.
- `null` when no stable post identity or media evidence exists.

Partial success:

- Return supported items even if some candidates fail.
- Add warnings for dropped or unsupported candidates.
- Never throw for malformed DOM; return `null` or a context with warnings.

## 15. Edge Case Handling

| Edge case | v0 behavior |
| --- | --- |
| Deleted or removed post | Return `null` unless media URL remains visible; add `post_deleted_or_removed` if detectable. |
| Media removed | Return context with empty `media` and `media_removed_or_unavailable`. |
| Text-only post | Return `null`; do not inject a download button. |
| Link post without direct media | Return unsupported warning; do not guess external adapters. |
| Crosspost | Extract visible media in the current post container; use current post id for filename/history. |
| Promoted post/ad | Skip unless it has a normal Reddit post permalink and supported media. |
| NSFW blurred media | Use visible DOM URLs only; optional reveal behavior can reuse `autoRevealNsfw`, but v0 extraction must not require it. |
| Lazy-loaded images/videos | Recheck the same post after mutation or load events. |
| Gallery missing items | Return found items and `gallery_partial_extraction`. |
| Thumbnail plus actual media | Keep actual media, drop unrelated thumbnail. |
| External media masquerading as post media | Accept only direct media URLs; otherwise unsupported. |
| Multiple visible posts | Process per post container and dedupe by post id. |
| Detail page vs feed page | Same detector; fallback to `location.pathname` for post id on detail page. |
| Old Reddit vs new Reddit | Use selector map from section 6. |
| Duplicate mutations | Use processed cache and DOM marker. |
| Media loads after button injection | Recheck and update button status; do not inject duplicate buttons. |
| Unavailable direct video URL | Add `video_requires_manifest_or_audio_merge`. |

## 16. Performance Strategy

Observer strategy:

- Observe Reddit app root or `body` once.
- On mutations, inspect added nodes and their nearest post containers.
- Do not rescan the full page on every mutation.
- Debounce post processing by about `150ms`.
- Limit each scan to the post container subtree.

Caches:

- Use `WeakSet<Element>` or a `data-harvest-*` marker to avoid duplicate button injection.
- Use `Map<string, { signature: string; checkedAt: number }>` keyed by `postId` for extraction state.
- Signature can be a cheap count/hash of media-bearing URLs found in the post.
- Reprocess a post when its media signature changes.

Lazy-load rechecks:

- Listen to mutation batches containing `img`, `source`, `video`, `shreddit-gallery`, or URL-bearing attributes.
- Recheck the affected post only.
- Avoid continuous polling.

Cleanup:

- Periodically remove cache entries whose elements are disconnected.
- Prefer `WeakMap<Element, State>` for element-scoped state so removed posts can be garbage collected.

Script parsing:

- Do not parse all page scripts repeatedly.
- Only inspect script/JSON nodes within the target post container.
- Parse embedded JSON only when DOM image/gallery extraction is incomplete.

## 17. UI Bridge Assumptions

The UI should be reused from TwitterMediaHarvest where possible.

The Reddit extractor provides:

- post identity: `postId`, `postFullname`, `permalink`
- filename metadata: `subreddit`, `author`, `title`, media `index`, media `ext`
- media items: normalized direct URLs only
- warnings for unsupported or partial media

The UI/downloader needs:

- whether a post has downloadable media
- whether the post was already downloaded
- button status: idle, downloading, success, error, downloaded
- download jobs with `url` and `filename`

Adapter location:

- Content script observer finds Reddit posts and asks `extractFromPostElement`.
- Button click sends either a `RedditMediaContext` or already-mapped `DownloadJob[]` to the service worker.
- Service worker dispatches jobs through the existing browser/Aria2 downloader path.

Fields to genericize later:

| Current Twitter term | Reddit/generic term |
| --- | --- |
| `tweetId` | `postId` |
| `screenName` | `author` |
| `TweetInfo` | `MediaPostInfo` or `RedditPostInfo` |
| `TweetMediaFile` | `MediaFile` or `RedditMediaItem` |
| `{tweetId}` token | `{postId}` token |
| `{account}` token | `{author}` token |

Keep v0 lazy: avoid a full generic domain rewrite until there is a second platform implementation need. Add a Reddit adapter that maps to the existing minimal `DownloadTarget` shape first.

## 18. Proposed File/Module Structure

Recommended Task 2 modules:

```text
src/reddit/reddit-types.ts
src/reddit/reddit-post-detector.ts
src/reddit/reddit-media-extractor.ts
src/reddit/reddit-url-normalizer.ts
src/reddit/reddit-video-extractor.ts
src/bridge/reddit-to-download-jobs.ts
src/contentScript/observers/RedditMediaObserver.ts
```

Do not create a separate gallery module initially. Keep gallery extraction inside `reddit-media-extractor.ts`; split it only if tests or readability prove it is worth the extra file.

Likely later adaptations:

- `src/libs/webExtMessage/messages/downloadRedditMedia.ts`
- `src/serviceWorker/messageHandlers/downloadRedditMediaHandler.ts`
- generic post-history lookup replacing `CheckDownloadHistoryMessage` tweet naming

## 19. Implementation Risks

- Reddit DOM changes frequently; selectors must be layered and tested against new Reddit and old Reddit fixtures.
- `v.redd.it` often exposes DASH/HLS or separate audio/video streams; v0 intentionally does not solve that.
- Gallery metadata may be partly hidden in app state; v0 only uses visible or embedded DOM data.
- NSFW and lazy-loaded content may not expose original URLs until visible.
- Existing filename/history code is tweet-shaped; Task 2 should adapt at the narrow bridge first, not rewrite the whole domain.
- Aria2 referrer must be Reddit permalink, not the current X hard-coded referrer.
- Existing CSP/host permissions only cover X/Twitter and must be changed for Reddit hosts when the extension is implemented.

## 20. Acceptance Criteria For Task 2

Task 2 implementation is acceptable when:

- It includes unit tests or DOM fixture tests for new Reddit `shreddit-post`, old Reddit `.thing.link`, direct image, gallery, gif/gifv, and best-effort video cases.
- It never calls Reddit APIs, GraphQL/internal APIs, or network interceptors.
- It returns the `RedditMediaContext` contract from a post element.
- It maps supported media items to `DownloadJob[]`.
- It filters avatars, subreddit icons, awards, emoji, UI images, and unrelated thumbnails.
- It handles duplicate mutation processing without duplicate buttons.
- It returns structured warnings for unsupported videos and partial galleries.
- It keeps v0 video scope to direct playable URLs only.
- It reuses existing browser/Aria2 download dispatch patterns instead of implementing a new downloader.
