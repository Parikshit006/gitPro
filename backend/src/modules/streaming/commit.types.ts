/**
 * Commit Streaming Domain Types & Interfaces
 *
 * Purpose:
 *   Defines domain data structures for commit window boundaries, consumer
 *   callbacks, and execution summaries within the Commit Streaming Engine.
 */

import { CommitEvent } from './commit.event';

export interface CommitWindow {
  repositoryId: string;
  oldHead: string | null;
  newHead: string;
}

export type CommitEventConsumer = (event: CommitEvent) => void | Promise<void>;

export interface CommitStreamSummary {
  repositoryId: string;
  totalStreamed: number;
  startTime: Date;
  endTime: Date;
  durationMs: number;
}
