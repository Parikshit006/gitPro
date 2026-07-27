import { useState } from 'react';
import { Modal } from './ui/Modal';
import { GitBranch, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { ConnectRepositoryModal } from './ConnectRepositoryModal';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const handleStartConnect = () => {
    onClose();
    setIsConnectOpen(true);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Welcome to GitPro" maxWidth="520px">
        <div className="flex flex-col items-center text-center py-4 gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--healthy-bg)] border border-[var(--healthy)] flex items-center justify-center text-[var(--healthy)] shadow-lg">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-display font-bold text-2xl text-[var(--text)]">
              Engineering Intelligence Awaits
            </h2>
            <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
              You are signed in! Let&apos;s connect your first Git repository to compute bus factor risks, knowledge silos, and AST hotspots.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)] text-left text-xs font-mono">
            <div className="flex items-center gap-2.5 text-[var(--text)]">
              <Check className="w-4 h-4 text-[var(--healthy)]" />
              <span>Zero code modification required</span>
            </div>
            <div className="flex items-center gap-2.5 text-[var(--text)]">
              <Check className="w-4 h-4 text-[var(--healthy)]" />
              <span>Automatic maintainer attribution indexing</span>
            </div>
            <div className="flex items-center gap-2.5 text-[var(--text)]">
              <ShieldCheck className="w-4 h-4 text-[var(--healthy)]" />
              <span>100% read-only secure OAuth token isolation</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 pt-2">
            <Button variant="primary" size="lg" onClick={handleStartConnect} className="w-full justify-center py-3">
              <GitBranch className="w-5 h-5 mr-2" /> Connect First Repository <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <button onClick={onClose} className="text-xs text-muted hover:text-[var(--text)] transition-colors font-mono">
              Skip for now, explore demo workspace →
            </button>
          </div>
        </div>
      </Modal>

      <ConnectRepositoryModal isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} />
    </>
  );
}
