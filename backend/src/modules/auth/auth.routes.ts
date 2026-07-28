/**
 * Auth Routes
 *
 * Purpose:
 *   Route registration for the Auth module. Maps HTTP verbs and paths
 *   to the corresponding controller methods.
 *
 * Endpoints:
 *   GET /api/v1/auth/github          — Initiates GitHub OAuth flow (redirects to GitHub)
 *   GET /api/v1/auth/github/callback — GitHub OAuth callback (exchanges code for JWT cookie)
 *   GET /api/v1/auth/me              — Returns the currently authenticated user (requires auth)
 *   POST /api/v1/auth/logout         — Clears the session cookie
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// OAuth initiation: redirects browser to GitHub
router.get('/github', authController.initiateGitHubOAuth);

// OAuth callback: exchanges code for JWT, sets cookie, redirects to frontend
router.get('/github/callback', authController.githubCallback);

// Get current authenticated user (cookie-based)
router.get('/me', authenticate, authController.getMe);

// Logout: clears the session cookie
router.post('/logout', authController.logout);

export default router;
