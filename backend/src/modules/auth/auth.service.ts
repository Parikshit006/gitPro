import { StateService } from './state.service';
import { GitHubProvider } from './github.provider';
import { UserRepository } from '../user/user.repository';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { User } from '@prisma/client';

/**
 * Auth Service (Application Service)
 *
 * Purpose:
 *   Orchestrates the complete authentication use case. It coordinates
 *   domain services (StateService), external integrations (GitHubProvider),
 *   and persistence (UserRepository) to fulfill the login flow.
 *
 * Why orchestration belongs here:
 *   The controller is only responsible for HTTP. The provider is only
 *   responsible for GitHub. The repository is only responsible for Prisma.
 *   The AuthService acts as the conductor — it knows the exact sequence
 *   of steps required to authenticate a user, but delegates the actual
 *   execution of those steps to specialized infrastructure layers.
 *
 * Why business logic is separated from infrastructure:
 *   By injecting dependencies and forbidding raw fetch() or Prisma calls
 *   in this file, the AuthService remains pure business logic. It can be
 *   unit tested by mocking the provider and repository, ensuring the
 *   authentication rules are verified without hitting real databases or APIs.
 *
 * Why state is deleted ONLY after successful persistence:
 *   If the state was deleted immediately upon validation, and the database
 *   upsert subsequently failed, the user would be forced to restart the
 *   entire OAuth flow. By deleting the state only after the transaction
 *   fully succeeds, we maintain atomicity of the operation while still
 *   guaranteeing single-use semantics.
 */


interface GitHubAuthorizationUrl {
  authorizationUrl: string;
  state: string;
}

export class AuthService {
  constructor(
    private readonly stateService = new StateService(),
    private readonly githubProvider = new GitHubProvider(),
    private readonly userRepository = new UserRepository(),
  ) {}

  /**
   * Builds a complete GitHub OAuth authorization URL.
   */
  buildAuthorizationUrl(): GitHubAuthorizationUrl {
    const state = this.stateService.createState();
    const authorizationUrl = this.githubProvider.buildAuthorizationUrl(state);

    return {
      authorizationUrl,
      state,
    };
  }

  /**
   * Orchestrates the GitHub OAuth callback flow.
   *
   * 1. Validates the CSRF state token.
   * 2. Exchanges the authorization code for an access token.
   * 3. Retrieves the user's GitHub profile.
   * 4. Upserts the user in the database.
   * 5. Deletes the state token to prevent replay attacks.
   */
  async authenticateWithGitHub(code: string, state: string): Promise<User> {
    // 1. Validate CSRF state
    const isValidState = this.stateService.validateState(state);
    if (!isValidState) {
      throw new AppError(
        'Authentication failed: invalid or expired state parameter',
        HTTP_STATUS.FORBIDDEN,
        true,
      );
    }

    // 2. Exchange authorization code for access token
    const accessToken = await this.githubProvider.exchangeCodeForAccessToken(code);

    // 3. Retrieve GitHub user profile
    const authenticatedGitHubUser = await this.githubProvider.getAuthenticatedUser(accessToken);

    // 4. Upsert user in the database
    const user = await this.userRepository.upsertByGitHubId(authenticatedGitHubUser);

    // 5. Delete state only after successful persistence
    this.stateService.deleteState(state);

    // 6. Return persisted User
    return user;
  }
}
