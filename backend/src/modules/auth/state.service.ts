import crypto from 'crypto';

/**
 * OAuth State Service
 *
 * Purpose:
 *   Manages the lifecycle of OAuth CSRF state tokens. Every authorization
 *   flow generates a unique state; this service creates, validates, and
 *   destroys those states.
 *
 * Security rationale:
 *
 *   Why states expire:
 *     A state token represents an active login attempt. If a user abandons
 *     the flow (closes the tab, walks away), the token must not live forever
 *     — it would consume memory indefinitely and widen the attack window.
 *     A 10-minute TTL bounds both resource usage and the time an attacker
 *     has to exploit a captured state value.
 *
 *   Why states are one-time use:
 *     After the callback validates a state, that state is immediately
 *     deleted. If an attacker replays the callback URL (containing the
 *     same code and state), the second request fails because the state
 *     no longer exists. This is the sole defense against replay attacks
 *     in the OAuth authorization code flow.
 *
 *   Why storage is abstracted:
 *     The MVP uses an in-memory Map for simplicity. In production with
 *     multiple backend instances behind a load balancer, in-memory storage
 *     breaks because a state created on instance A cannot be validated on
 *     instance B. The public API (createState / validateState / deleteState)
 *     is designed so the internal Map can be swapped to Redis without
 *     changing any caller.
 */

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface StoredState {
  createdAt: number;
}

export class StateService {
  private readonly store = new Map<string, StoredState>();

  /**
   * Generates a cryptographically secure state token, stores it with a
   * timestamp, and returns the raw token string.
   */
  createState(): string {
    const state = crypto.randomBytes(32).toString('hex');

    this.store.set(state, { createdAt: Date.now() });

    return state;
  }

  /**
   * Checks whether a state token exists and has not expired.
   * Does NOT delete the token — call deleteState() explicitly after
   * the full callback flow succeeds to maintain atomicity.
   */
  validateState(state: string): boolean {
    const entry = this.store.get(state);

    if (!entry) {
      return false;
    }

    const age = Date.now() - entry.createdAt;

    if (age > STATE_TTL_MS) {
      // Expired — clean it up and reject
      this.store.delete(state);
      return false;
    }

    return true;
  }

  /**
   * Removes a state token from storage. Called after the callback flow
   * completes successfully to enforce one-time use.
   */
  deleteState(state: string): void {
    this.store.delete(state);
  }
}
