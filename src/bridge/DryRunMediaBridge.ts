import type {
  GenericDownloadJob,
  GenericMediaPostContext,
} from './generic-media-types.ts'

export interface MediaBridgeSink {
  receiveContext(context: GenericMediaPostContext): void
  receiveDownloadJobs(jobs: GenericDownloadJob[]): void
}

export class DryRunMediaBridge implements MediaBridgeSink {
  public readonly contexts: GenericMediaPostContext[] = []
  public readonly jobs: GenericDownloadJob[] = []

  receiveContext(context: GenericMediaPostContext): void {
    this.contexts.push(context)
  }

  receiveDownloadJobs(jobs: GenericDownloadJob[]): void {
    this.jobs.push(...jobs)
  }
}

