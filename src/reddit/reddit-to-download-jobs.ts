import type { DownloadJob, RedditMediaContext } from './reddit-types.ts'
import { genericMediaContextToDownloadJobs } from '../bridge/generic-download-jobs.ts'
import { redditMediaContextToGenericMediaContext } from '../bridge/reddit-to-generic-media.ts'

export function redditMediaContextToDownloadJobs(
  context: RedditMediaContext
): DownloadJob[] {
  const genericContext = redditMediaContextToGenericMediaContext(context)
  return genericMediaContextToDownloadJobs(
    {
      ...genericContext,
      community: context.subreddit,
    },
    {
      filenameTemplate: '{community}_{author}_{postId}_{index}.{ext}',
      indexPad: 2,
    }
  ).map(({ url, filename, mode }) => ({
    url,
    filename,
    ...(mode ? { mode } : {}),
  }))
}
