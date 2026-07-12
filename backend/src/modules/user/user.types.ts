/**
 * Purpose: Defines the core data structures and types for the User domain.
 * Responsibilities: Shared domain models and interfaces.
 * Future responsibilities: GitHub OAuth payload types, User roles, Analytics preferences.
 */

export interface User {
  id: string;
  githubId: string; // BigInt mapped to string in domain model for safety
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string;
  profileUrl: string;
  isActive: boolean;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}
