import crypto from 'crypto';
import { githubOAuthConfig } from '../../config/githubOAuth.config';

/**
 * Auth Service
 *
 * Purpose:
 *   Encapsulates the business logic for initiating the GitHub OAuth 2.0
 *   authorization flow. This service is transport-agnostic — it has no
 *   knowledge of Express, HTTP, or request/response objects.
 *
 * Current responsibility:
 *   Building a complete, secure GitHub authorization URL.
 */

const GITHUB_AUTHORIZE_ENDPOINT = 'https://github.com/login/oauth/authorize';

/**
 * Minimum required scopes for GitPro MVP.
 *
 * Why least privilege:
 *   Requesting only `read:user` and `user:email` ensures GitPro asks for
 *   the absolute minimum permissions needed to identify a developer and
 *   retrieve their email. Requesting broader scopes (e.g., `repo`, `admin`)
 *   would trigger additional GitHub consent warnings, reduce user trust,
 *   and violate the principle of least privilege. Scopes can be expanded
 *   incrementally in future features when justified.
 */
const SCOPES = Object.freeze(['read:user', 'user:email'] as const);

interface GitHubAuthorizationUrl {
  authorizationUrl: string;
  state: string;
}

export class AuthService {
  /**
   * Builds a complete GitHub OAuth authorization URL.
   *
   * Returns the URL the client should be redirected to, along with the
   * generated state value (for later CSRF verification in the callback).
   */
  buildAuthorizationUrl(): GitHubAuthorizationUrl {
    /**
     * Why state must be cryptographically random:
     *   The `state` parameter is the sole defense against CSRF attacks in
     *   the OAuth 2.0 authorization code flow. An attacker who can predict
     *   or forge the state value can trick a victim's browser into completing
     *   an OAuth flow that binds the attacker's GitHub account to the
     *   victim's GitPro session. Using `crypto.randomBytes` guarantees 32
     *   bytes (256 bits) of entropy from the OS CSPRNG, making the value
     *   computationally infeasible to predict.
     */
    const state = crypto.randomBytes(32).toString('hex');

    /**
     * Why the URL is built with the WHATWG URL API instead of string concatenation:
     *   1. Automatic encoding — Special characters in parameter values are
     *      percent-encoded by `searchParams.set()`, preventing injection.
     *   2. Structural correctness — The URL API guarantees a well-formed URL
     *      with proper `?` and `&` delimiters regardless of parameter order.
     *   3. Maintainability — Adding or removing parameters is a single
     *      method call, not a fragile template literal edit.
     */
    const url = new URL(GITHUB_AUTHORIZE_ENDPOINT);
    url.searchParams.set('client_id', githubOAuthConfig.clientId);
    url.searchParams.set('redirect_uri', githubOAuthConfig.callbackUrl);
    url.searchParams.set('scope', SCOPES.join(' '));
    url.searchParams.set('state', state);

    return {
      authorizationUrl: url.toString(),
      state,
    };
  }
}
