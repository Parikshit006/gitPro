/**
 * Repository Service (Application Service)
 *
 * Purpose:
 *   Orchestrates the complete repository registration use case. It
 *   validates the incoming URL, normalizes it, extracts the owner and
 *   repository name, verifies the repository exists on GitHub, checks
 *   for duplicates, persists the metadata, and returns the registered
 *   repository.
 *
 * Why URL validation belongs in the service:
 *   URL validation is a business rule — "only GitHub repositories are
 *   accepted." The controller's job is to extract the raw string from
 *   the HTTP body; the service decides whether that string represents
 *   a valid, registerable repository.
 *
 * Why the service calls the GitHub API:
 *   The service needs to verify the repository exists and retrieve its
 *   metadata (default branch, size, language, etc.) before persisting.
 *   It delegates the HTTP call to a focused method, keeping the
 *   orchestration logic readable and the fetch concern isolated.
 *
 * Why duplicate detection uses the repository layer:
 *   The service asks the repository layer whether a record with the
 *   same owner/name already exists. This keeps the uniqueness check
 *   in the database (the only source of truth for persistence) rather
 *   than relying on in-memory state that could be stale in a
 *   multi-instance deployment.
 *
 * Why the service never touches Express:
 *   By keeping the service free of `req`, `res`, and `next`, it
 *   remains independently testable, reusable from background jobs
 *   or CLI tools, and decoupled from the transport protocol.
 */

import { RepositoryRepository } from './repository.repository';
import { Repository, GitHubRepositoryMetadata } from './repository.types';

import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

/**
 * Strict regex for validating GitHub repository URLs.
 *
 * Accepts:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/
 *
 * Rejects:
 *   http:// (non-HTTPS)
 *   https://gitlab.com/...
 *   https://github.com/owner (missing repo)
 *   https://github.com/owner/repo/tree/main (trailing segments)
 *   https://github.com/ (missing both)
 *
 * Owner and repo name rules from GitHub:
 *   - Owner: alphanumeric and hyphens, no leading/trailing hyphens
 *   - Repo: alphanumeric, hyphens, underscores, dots
 */
const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/([a-zA-Z0-9._-]+?)(?:\.git)?\/?$/;

/** GitHub REST API base URL for repository endpoints. */
const GITHUB_API_BASE = 'https://api.github.com';

/** Request timeout for GitHub API calls in milliseconds. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Raw shape of GitHub's /repos/{owner}/{repo} API response (only fields we read). */
interface GitHubRawRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
  visibility: string;
  clone_url: string;
  size: number;
  language: string | null;
  description: string | null;
}

export class RepositoryService {
  private readonly repositoryRepository: RepositoryRepository;

  constructor() {
    this.repositoryRepository = new RepositoryRepository();
  }

  /**
   * Registers a GitHub repository within GitPro.
   *
   * Orchestration steps:
   *   1. Validate URL format
   *   2. Normalize and extract owner/name
   *   3. Check for existing registration (duplicate guard)
   *   4. Fetch metadata from GitHub REST API
   *   5. Persist repository record
   *   6. Return domain Repository
   *
   * @param url The raw GitHub repository URL provided by the user.
   * @returns The persisted domain Repository.
   */
  async registerRepository(url: string): Promise<Repository> {
    // 1. Validate and extract
    const { owner, name } = this.validateAndExtract(url);

    // 2. Check for duplicates
    const existing = await this.repositoryRepository.findByFullName(owner, name);
    if (existing) {
      throw new AppError(
        `Repository ${owner}/${name} is already registered`,
        HTTP_STATUS.CONFLICT,
        true,
      );
    }

    // 3. Fetch metadata from GitHub (verifies existence)
    const metadata = await this.fetchGitHubMetadata(owner, name);

    // 4. Persist
    const repository = await this.repositoryRepository.create({
      metadata,
    });

    return repository;
  }


  /**
   * Validates the URL format and extracts owner and repository name.
   *
   * @param url The raw URL string.
   * @returns Extracted owner and name.
   * @throws AppError (400) if the URL is invalid.
   */
  private validateAndExtract(url: string): { owner: string; name: string } {
    if (!url || typeof url !== 'string') {
      throw new AppError(
        'Repository URL is required',
        HTTP_STATUS.BAD_REQUEST,
        true,
      );
    }

    const trimmed = url.trim();

    const match = GITHUB_URL_REGEX.exec(trimmed);
    if (!match) {
      throw new AppError(
        'Invalid GitHub repository URL. Expected format: https://github.com/{owner}/{repo}',
        HTTP_STATUS.BAD_REQUEST,
        true,
      );
    }

    const owner = match[1];
    const name = match[2];

    return { owner, name };
  }

  /**
   * Fetches repository metadata from the GitHub REST API.
   *
   * Uses the unauthenticated public endpoint. Rate limit: 60 req/hour.
   * For private repository support, a user's access token would be
   * required — that is a future phase concern.
   *
   * @param owner GitHub owner/organization.
   * @param name Repository name.
   * @returns Extracted GitHubRepositoryMetadata.
   * @throws AppError (404) if the repository does not exist on GitHub.
   * @throws AppError (500) if the GitHub API call fails unexpectedly.
   */
  private async fetchGitHubMetadata(owner: string, name: string): Promise<GitHubRepositoryMetadata> {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${name}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'GitPro-Backend',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new AppError(
          'GitHub API request timed out. Please try again.',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          true,
        );
      }

      throw new AppError(
        'Failed to connect to GitHub API',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    if (response.status === 404) {
      throw new AppError(
        `Repository ${owner}/${name} was not found on GitHub`,
        HTTP_STATUS.NOT_FOUND,
        true,
      );
    }

    if (!response.ok) {
      throw new AppError(
        `GitHub API returned unexpected status: ${response.status}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    const data = (await response.json()) as GitHubRawRepository;

    return {
      githubId: data.id,
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      defaultBranch: data.default_branch,
      visibility: data.visibility,
      cloneUrl: data.clone_url,
      sizeKb: data.size,
      language: data.language,
      description: data.description,
    };
  }
}
