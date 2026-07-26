/**
 * Commit Event Domain Object
 *
 * Purpose:
 *   Represents a single Git commit as an immutable domain event.
 *   Decoupled from Prisma, ORM annotations, and database persistence layers.
 *   Acts as the fundamental currency of data exchanged across GitPro streaming pipelines.
 */
export class CommitEvent {
  readonly repositoryId: string;
  readonly hash: string;
  readonly parents: ReadonlyArray<string>;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly authorDate: Date;
  readonly committerName: string;
  readonly committerEmail: string;
  readonly committerDate: Date;
  readonly message: string;
  readonly timestamp: Date;
  readonly modifiedFiles: ReadonlyArray<string>;

  constructor(params: {
    repositoryId: string;
    hash: string;
    parents: ReadonlyArray<string>;
    authorName: string;
    authorEmail: string;
    authorDate: Date;
    committerName: string;
    committerEmail: string;
    committerDate: Date;
    message: string;
    timestamp?: Date;
    modifiedFiles?: ReadonlyArray<string>;
  }) {
    this.repositoryId = params.repositoryId;
    this.hash = params.hash;
    this.parents = Object.freeze([...params.parents]);
    this.authorName = params.authorName;
    this.authorEmail = params.authorEmail;
    this.authorDate = params.authorDate;
    this.committerName = params.committerName;
    this.committerEmail = params.committerEmail;
    this.committerDate = params.committerDate;
    this.message = params.message;
    this.timestamp = params.timestamp ?? new Date();
    this.modifiedFiles = Object.freeze([...(params.modifiedFiles ?? [])]);
    Object.freeze(this);
  }
}
