import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Modal } from './ui/Modal';
import { CheckCircle2, Loader2, GitBranch, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';

interface AnalysisPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoUrl: string;
}

const STAGES = [
  { id: 1, label: 'Repository Connected', desc: 'Verified public/private access and OAuth tokens.', time: '1s' },
  { id: 2, label: 'Cloning Repository', desc: 'Fetching git packfiles and checking out default branch.', time: '3s' },
  { id: 3, label: 'Reading Commit History', desc: 'Parsing commit timeline, author signatures, and file diffs.', time: '4s' },
  { id: 4, label: 'Building Engineering Graph', desc: 'Constructing commit-file-author relationship network.', time: '5s' },
  { id: 5, label: 'Computing Metrics & Hotspots', desc: 'Calculating bus factor risk and churn vs complexity scores.', time: '2s' },
  { id: 6, label: 'Generating AI Insights', desc: 'Synthesizing executive summary and structural recommendations.', time: '3s' },
  { id: 7, label: 'Preparing Workspace', desc: 'Finalizing dashboard telemetry and scorecard.', time: '1s' },
];

export function AnalysisPipelineModal({ isOpen, onClose, repoUrl }: AnalysisPipelineModalProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(1);
      setIsComplete(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length) {
          return prev + 1;
        } else {
          setIsComplete(true);
          clearInterval(interval);
          return prev;
        }
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleOpenDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  const cleanRepoName = repoUrl
    .replace('https://github.com/', '')
    .replace('git@github.com:', '')
    .replace('.git', '') || 'repository/analysis';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Analyzing Repository" maxWidth="600px">
      <div className="flex flex-col gap-6 py-2">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <GitBranch className="w-5 h-5 text-[var(--healthy)] shrink-0" />
          <div className="flex flex-col overflow-hidden">
            <span className="font-mono text-sm text-[var(--text)] font-semibold truncate">{cleanRepoName}</span>
            <span className="text-xs text-muted">Linear Deployment Engine • Zero local setup</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 pl-2 border-l-2 border-[var(--border)] ml-3">
          {STAGES.map((stage) => {
            const isDone = stage.id < currentStage || isComplete;
            const isCurrent = stage.id === currentStage && !isComplete;
            const isPending = stage.id > currentStage;

            return (
              <div 
                key={stage.id} 
                className={`flex items-start gap-3.5 transition-all duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="mt-0.5 shrink-0 -ml-[23px] bg-[var(--bg)] p-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--healthy)]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-[var(--text)] animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] bg-[var(--bg-surface)]" />
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-[var(--text)] font-semibold' : 'text-[var(--text)]'}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs font-mono text-muted">{stage.time}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{stage.desc}</p>
                  
                  {isCurrent && (
                    <div className="w-full h-1 bg-[var(--bg-surface)] rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-[var(--healthy)] animate-pulse w-2/3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
          {isComplete ? (
            <Button variant="primary" onClick={handleOpenDashboard} className="w-full justify-center">
              Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose} className="w-full justify-center opacity-70" disabled>
              Processing pipeline...
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
