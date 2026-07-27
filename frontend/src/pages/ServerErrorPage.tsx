import { useNavigate } from 'react-router';
import { AlertTriangle, RotateCcw, Home, GitBranch } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 text-center font-body selection:bg-[var(--healthy)] selection:text-[var(--bg)]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--critical-bg)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center mb-6 shadow-2xl">
        <AlertTriangle className="w-8 h-8 text-[var(--critical)]" />
      </div>

      <span className="font-mono text-sm text-[var(--critical)] uppercase tracking-widest mb-2">Error 500 • Internal System Exception</span>
      <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 tracking-tight">
        Engine telemetry interrupted.
      </h1>
      <p className="text-muted text-base max-w-md mb-8 leading-relaxed">
        We encountered an unexpected error while indexing commit graphs or evaluating AST metrics in PostgreSQL.
      </p>

      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          <RotateCcw className="w-4 h-4 mr-1.5" /> Retry Request
        </Button>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          <Home className="w-4 h-4 mr-1.5" /> Return to Dashboard
        </Button>
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-muted">
        <GitBranch className="w-3.5 h-3.5 text-[var(--healthy)]" />
        <span>GitPro Engineering Intelligence Platform</span>
      </div>
    </div>
  );
}
