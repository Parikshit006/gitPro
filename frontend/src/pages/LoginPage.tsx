/* ============================================================
   GitPro — Login Page

   Centered glass card with backdrop blur and direct GitHub
   OAuth redirect. No forms or fake auth.

   GitHub OAuth flow:
     1. Frontend redirects browser to → backend /api/v1/auth/github
     2. Backend builds GitHub authorization URL and redirects
     3. User authorizes on GitHub
     4. GitHub redirects to → backend /api/v1/auth/github/callback
     5. Backend exchanges code for JWT, sets HttpOnly cookie
     6. Backend redirects to → frontend /dashboard
   ============================================================ */

import { GitBranch } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const handleLogin = () => {
    // Direct browser redirect to backend OAuth initiation endpoint.
    // Note: The endpoint is /auth/github (not /auth/github/login).
    // The API_BASE_URL typically includes /api/v1, so we strip that here
    // and build the correct URL: http://localhost:3000/api/v1/auth/github
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiBase}/auth/github`;
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-header">
          <h1 className="font-display">GitPro Intelligence</h1>
          <p className="text-muted font-body">Sign in to access engineering analytics &amp; knowledge graphs</p>
        </div>

        <button
          onClick={handleLogin}
          className="login-button font-body"
        >
          <GitBranch className="icon" />
          Continue with GitHub
        </button>
      </div>
    </div>
  );
}
