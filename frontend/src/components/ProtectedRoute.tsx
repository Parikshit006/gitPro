/* ============================================================
   GitPro — Protected Route
   
   Route wrapper that attempts to fetch a quick authenticated
   endpoint (e.g., repositories list or user profile). If it
   fails with 401, the Axios interceptor will redirect to /login.
   ============================================================ */

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { api } from '../lib/api';

export default function ProtectedRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Ping an endpoint to verify session validity
    // The axios interceptor handles the 401 redirect automatically if this fails.
    api.get('/repositories')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)] text-[var(--text-muted)]">
        <div className="skeleton" style={{ width: '100px', height: '20px' }} />
      </div>
    );
  }

  if (isAuthenticated === false) {
    // Return null while Axios interceptor redirects
    return null;
  }

  return <Outlet />;
}
