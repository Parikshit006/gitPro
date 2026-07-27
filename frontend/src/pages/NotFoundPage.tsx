import { useNavigate } from 'react-router';
import { ShieldAlert, ArrowLeft, GitBranch, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 text-center font-body selection:bg-[var(--healthy)] selection:text-[var(--bg)]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-2xl animate-bounce">
        <ShieldAlert className="w-8 h-8 text-[var(--risk)]" />
      </div>

      <span className="font-mono text-sm text-muted uppercase tracking-widest mb-2">Error 404 • Resource Not Found</span>
      <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 tracking-tight">
        Architectural domain unmapped.
      </h1>
      <p className="text-muted text-base max-w-md mb-8 leading-relaxed">
        The requested URL path or repository ID does not exist in our tracked Git index or has been archived from PostgreSQL.
      </p>

      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Go Back
        </Button>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          <Home className="w-4 h-4 mr-1.5" /> Workspace Dashboard
        </Button>
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-muted">
        <GitBranch className="w-3.5 h-3.5 text-[var(--healthy)]" />
        <span>GitPro Engineering Intelligence Platform</span>
      </div>
    </div>
  );
}
