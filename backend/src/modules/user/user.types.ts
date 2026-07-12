/**
 * Purpose: Defines the core data structures and types for the User domain.
 * Responsibilities: Shared domain models and interfaces.
 * Future responsibilities: GitHub OAuth payload types, User roles, Analytics preferences.
 */

export interface User {
  id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
