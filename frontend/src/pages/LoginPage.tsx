/* ============================================================
   GitPro — Login Page
   
   Centered glass card with backdrop blur and direct GitHub 
   OAuth redirect. No forms or fake auth.
   ============================================================ */

import { GitBranch } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const handleLogin = () => {
    // Direct browser redirect to backend OAuth initiation endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/github/login`;
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-header">
          <h1 className="font-display">GitPro Intelligence</h1>
          <p className="text-muted font-body">Sign in to access engineering analytics & knowledge graphs</p>
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
