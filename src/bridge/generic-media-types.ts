export type MediaPlatform = 'reddit' | 'x' | 'twitter' | 'unknown'

export type GenericMediaType = 'image' | 'video' | 'gif' | 'unsupported'

export interface GenericMediaItem {
  type: GenericMediaType
  url?: string
  index: number
  filenameHint?: string
  source?: string
  quality?: string
  unsupportedReason?: string
}

export interface GenericMediaPostContext {
  platform: MediaPlatform
  postId: string
  author?: string
  community?: string
  title?: string
  text?: string
  permalink?: string
  media: GenericMediaItem[]
  warnings?: string[]
}

export interface GenericDownloadJob {
  url: string
  filename: string
  mode?: 'chrome' | 'aria2'
  metadata?: {
    platform?: MediaPlatform
    postId?: string
    mediaType?: GenericMediaType
    index?: number
  }
}

