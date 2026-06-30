export type RedditMediaType = 'image' | 'video' | 'gif' | 'unsupported'

export type RedditMediaSource =
  | 'i.redd.it'
  | 'preview.redd.it'
  | 'external-preview.redd.it'
  | 'v.redd.it'
  | 'dom'
  | 'json'
  | 'external'

export type RedditMediaQuality =
  | 'original'
  | 'preview'
  | 'thumbnail'
  | 'unknown'

export type UnsupportedReason =
  | 'video_requires_manifest_or_audio_merge'
  | 'external_gif_adapter_not_supported'
  | 'unsupported_media_url'
  | 'video_poster_only'

export interface RedditMediaItem {
  type: RedditMediaType
  url?: string
  index?: number
  filenameHint?: string
  source?: RedditMediaSource
  quality?: RedditMediaQuality
  ext?: string
  unsupportedReason?: UnsupportedReason | string
}

export interface RedditMediaContext {
  platform: 'reddit'
  postId: string
  postFullname?: string
  subreddit?: string
  author?: string
  title?: string
  permalink?: string
  media: RedditMediaItem[]
  warnings?: string[]
}

export interface DownloadJob {
  url: string
  filename: string
  mode?: 'chrome' | 'aria2'
}

export interface RedditPostMetadata {
  postId: string
  postFullname?: string
  subreddit?: string
  author?: string
  title?: string
  permalink?: string
}

export interface RawRedditMediaCandidate {
  url: string
  kind?: RedditMediaType
  source?: RedditMediaSource
  quality?: RedditMediaQuality
  fromPoster?: boolean
  order?: number
}
