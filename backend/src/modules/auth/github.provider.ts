import { githubOAuthConfig } from '../../config/githubOAuth.config';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

/**
 * GitHub Provider
 *
 * Purpose:
 *   The external service integration layer for GitHub. This provider
 *   encapsulates all HTTP communication with GitHub's OAuth APIs,
 *   keeping the AuthService free of network concerns.
 *
 *   Why the access token must never be logged:
 *     An access token grants full read access to the authenticated
 *     user's GitHub identity and email. If it appears in application
 *     logs, error tracking, or stdout, any operator with log access
 *     can impersonate that user on GitHub. Tokens are treated as
 *     opaque credentials and never serialized outside of HTTP headers.
 *
 *   Why GitHub ID is used instead of username:
 *     GitHub usernames are mutable — a user can rename their account
 *     at any time. The numeric GitHub ID is permanent and immutable,
 *     making it the only reliable key for identity persistence.
 *
 *   Why provider responses are mapped into internal models:
 *     GitHub's API returns dozens of fields, most irrelevant to GitPro.
 *     Mapping to a minimal internal interface (GitHubUserProfile)
 *     prevents upstream API changes from rippling through the codebase
 *     and avoids accidentally leaking sensitive GitHub metadata.
 *
 * Security rationale:
 *
 *   Why client_secret never leaves the backend:
 *     The client_secret is the credential that proves to GitHub that
 *     the request originates from the registered OAuth application.
 *     If it were exposed to the frontend (via browser code, network
 *     traffic, or logs), any attacker could impersonate GitPro and
 *     exchange stolen authorization codes for access tokens. The
 *     secret exists only in server memory, loaded from environment
 *     variables at startup.
 *
 *   Why Accept: application/json is required:
 *     GitHub's token endpoint defaults to returning
 *     application/x-www-form-urlencoded. Without the explicit Accept
 *     header, the response is a query string rather than structured
 *     JSON, making error detection fragile and parsing error-prone.
 *
 *   Why authorization codes are single-use:
 *     Authorization codes travel through the browser's URL bar, making
 *     them visible in browser history, server logs, and Referer headers.
 *     GitHub enforces single-use semantics: once a code is exchanged,
 *     any subsequent attempt to exchange the same code revokes the
 *     previously issued access token, limiting the damage of interception.
 *
 *   Why HTTPS is mandatory:
 *     The token exchange transmits the client_secret and receives an
 *     access token. Over plain HTTP, both values are visible to any
 *     network observer. TLS ensures confidentiality and integrity of
 *     this server-to-server communication.
 */

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

/** Request timeout in milliseconds. Prevents the backend from hanging
 *  indefinitely if GitHub is slow or unreachable. */
const REQUEST_TIMEOUT_MS = 10_000;

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubTokenError {
  error: string;
  error_description: string;
  error_uri?: string;
}

/** Raw shape of GitHub's /user API response (only fields we read). */
interface GitHubRawUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

/** GitPro's internal representation of a GitHub-authenticated user. */
export interface GitHubUserProfile {
  githubId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

export class GitHubProvider {
  /**
   * Exchanges a single-use authorization code for a GitHub access token.
   *
   * Never logs the code, the access token, or the client secret.
   */
  async exchangeCodeForAccessToken(code: string): Promise<string> {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: githubOAuthConfig.clientId,
        client_secret: githubOAuthConfig.clientSecret,
        code,
        redirect_uri: githubOAuthConfig.callbackUrl,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new AppError(
        'Authentication failed: unable to verify credentials with GitHub',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    // Validate Content-Type to guard against unexpected response formats
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new AppError(
        'Authentication failed: unexpected response from GitHub',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    const data = (await response.json()) as GitHubTokenResponse | GitHubTokenError;

    if ('error' in data) {
      throw new AppError(
        'Authentication failed: GitHub rejected the authorization request',
        HTTP_STATUS.UNAUTHORIZED,
        true,
      );
    }

    const tokenData = data as GitHubTokenResponse;

    if (!tokenData.access_token) {
      throw new AppError(
        'Authentication failed: no access token received',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    // Verify the token type is the expected bearer token
    if (tokenData.token_type?.toLowerCase() !== 'bearer') {
      throw new AppError(
        'Authentication failed: unexpected token type received',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    return tokenData.access_token;
  }

  /**
   * Retrieves the authenticated GitHub user's profile.
   *
   * Maps GitHub's raw API response into GitPro's internal domain model.
   * Never logs the access token.
   */
  async getAuthenticatedUser(accessToken: string): Promise<GitHubUserProfile> {
    const response = await fetch(GITHUB_USER_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      throw new AppError(
        'Authentication failed: GitHub access token is invalid or expired',
        HTTP_STATUS.UNAUTHORIZED,
        true,
      );
    }

    if (response.status === HTTP_STATUS.FORBIDDEN) {
      throw new AppError(
        'Authentication failed: insufficient GitHub permissions',
        HTTP_STATUS.FORBIDDEN,
        true,
      );
    }

    if (!response.ok) {
      throw new AppError(
        'Authentication failed: unable to retrieve GitHub user profile',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      throw new AppError(
        'Authentication failed: unexpected response from GitHub',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    const raw = (await response.json()) as GitHubRawUser;

    if (!raw.id || !raw.login || !raw.avatar_url || !raw.html_url) {
      throw new AppError(
        'Authentication failed: GitHub returned an incomplete user profile',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }

    return {
      githubId: raw.id,
      username: raw.login,
      displayName: raw.name || raw.login,
      avatarUrl: raw.avatar_url,
      profileUrl: raw.html_url,
    };
  }
}
