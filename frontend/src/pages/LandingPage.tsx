import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { GitBranch, ArrowRight, Sparkles, ShieldAlert, GitMerge, Users, Activity, FileText, Check, Search, Lock, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { AnalysisPipelineModal } from '../components/AnalysisPipelineModal';
import './LandingPage.css';

const HEADLINES = [
  'Understand Your Code.',
  'Understand Your Team.',
  'Understand Engineering.',
  'Engineering Intelligence, Built From Git.',
  'GitPro',
];

export default function LandingPage() {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [repoUrl, setRepoUrl] = useState('');
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % HEADLINES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repoUrl.trim()) {
      setRepoUrl('https://github.com/facebook/react');
    }
    setIsPipelineOpen(true);
  };

  const handleGitHubLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiBase}/auth/github`;
  };

  return (
    <div className="landing-page min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-body selection:bg-[var(--healthy)] selection:text-[var(--bg)]">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[rgba(10,12,16,0.8)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-lg bg-[var(--text)] text-[var(--bg)] flex items-center justify-center font-display font-bold text-lg">
            G
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">GitPro</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-sm text-muted hover:text-[var(--text)] transition-colors">
            Sign In
          </button>
          <Button variant="primary" size="sm" onClick={handleGitHubLogin}>
            <GitBranch className="w-4 h-4 mr-1.5" /> Continue with GitHub
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 max-w-5xl mx-auto">
        
        {/* Animated Morphing Headline */}
        <div className="h-24 md:h-28 flex items-center justify-center overflow-hidden mb-6">
          <h1 
            key={headlineIndex} 
            className="headline-morph font-display text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-[rgba(255,255,255,0.9)] to-[rgba(255,255,255,0.5)] bg-clip-text text-transparent"
          >
            {HEADLINES[headlineIndex]}
          </h1>
        </div>

        <p className="text-lg md:text-xl text-muted max-w-3xl mb-12 font-body leading-relaxed">
          Transform Git repositories into engineering intelligence with knowledge graphs, ownership analysis, architectural hotspots, executive insights, and AI-powered reports.
        </p>

        {/* Main Action Area (Raycast / Spotlight Search Bar) */}
        <form onSubmit={handleAnalyze} className="w-full max-w-2xl mb-8">
          <div className="spotlight-bar flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-2 shadow-2xl transition-all duration-300 focus-within:border-[var(--healthy)] focus-within:shadow-[0_0_30px_rgba(45,212,191,0.15)]">
            <Search className="w-6 h-6 text-muted ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Paste GitHub Repository URL... https://github.com/facebook/react"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-transparent border-none text-base font-mono px-4 py-3 text-[var(--text)] placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--healthy)] transition-colors font-display font-semibold text-sm px-5 py-3 rounded-xl flex items-center gap-1.5"
            >
              Analyze <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-mono text-muted uppercase tracking-widest">— OR —</span>
          <button
            onClick={handleGitHubLogin}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[var(--bg-hover)] transition-all font-display font-medium text-sm"
          >
            <GitBranch className="w-5 h-5" /> Continue with GitHub
          </button>
          <div className="flex items-center gap-6 text-xs text-muted mt-2 font-mono">
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[var(--healthy)]" /> Private repositories supported</span>
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-[var(--healthy)]" /> Secure OAuth</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-[var(--healthy)]" /> Zero local setup</span>
          </div>
        </div>
      </section>

      {/* Section 1: How GitPro Works (Timeline) */}
      <section className="py-24 border-t border-[var(--border-subtle)] px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <Badge variant="healthy" className="mb-3">Pipeline</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold">How GitPro Works</h2>
          <p className="text-muted mt-2">Continuous automated intelligence directly from your commit history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {[
            { step: '01', title: 'Connect', desc: 'Secure OAuth or public repository clone URL.' },
            { step: '02', title: 'Clone', desc: 'Fast bare git checkout and packfile indexing.' },
            { step: '03', title: 'Analyze', desc: 'Deterministic AST and file churn complexity scoring.' },
            { step: '04', title: 'Understand', desc: 'Graph clustering of developer knowledge domains.' },
            { step: '05', title: 'Improve', desc: 'Automated risk mitigation and executive reports.' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] relative group hover:border-[var(--border)] transition-all">
              <span className="font-mono text-2xl font-bold text-[var(--healthy)] opacity-50 mb-3">{item.step}</span>
              <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Engineering Graph Visualization */}
      <section className="py-24 bg-[var(--bg-surface)] border-t border-b border-[var(--border-subtle)] px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <Badge variant="neutral">Knowledge Graph</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              Map the invisible connections between developers and code.
            </h2>
            <p className="text-muted leading-relaxed">
              Traditional Git hosting shows code diffs. GitPro builds a multi-dimensional graph linking commit events, file maintainers, and architectural boundaries to reveal who truly owns each domain.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)]">
                <Users className="w-5 h-5 text-[var(--healthy)] mb-2" />
                <h4 className="font-semibold text-sm">Developer Attribution</h4>
                <p className="text-xs text-muted mt-1">Calculates exact percentage of historical authorship.</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)]">
                <GitMerge className="w-5 h-5 text-[var(--healthy)] mb-2" />
                <h4 className="font-semibold text-sm">Dependency Clusters</h4>
                <p className="text-xs text-muted mt-1">Identifies tightly coupled modules and siloed knowledge.</p>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-6 relative overflow-hidden flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 bg-radial-gradient from-[rgba(45,212,191,0.08)] to-transparent" />
            <div className="flex flex-col items-center gap-6 relative z-10 w-full max-w-md">
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between w-full shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--healthy-bg)] text-[var(--healthy)] flex items-center justify-center font-bold">A</div>
                  <div>
                    <div className="text-sm font-semibold">Alice (Principal Architect)</div>
                    <div className="text-xs font-mono text-muted">91% ownership • src/payments/*</div>
                  </div>
                </div>
                <Badge variant="healthy">Primary</Badge>
              </div>
              <div className="w-0.5 h-8 bg-gradient-to-b from-[var(--healthy)] to-[var(--risk)]" />
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between w-full shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--risk-bg)] text-[var(--risk)] flex items-center justify-center font-bold">B</div>
                  <div>
                    <div className="text-sm font-semibold">Bob (Senior Backend)</div>
                    <div className="text-xs font-mono text-muted">9% ownership • Needs cross-training</div>
                  </div>
                </div>
                <Badge variant="risk">Silo Risk</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Metrics & Scorecards */}
      <section className="py-24 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <Badge variant="neutral" className="mb-3">Deterministic Engine</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Comprehensive Engineering Metrics</h2>
          <p className="text-muted mt-2">Zero subjectivity. Automated telemetry calculated on every git commit.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <ShieldAlert className="w-8 h-8 text-[var(--critical)] mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">Bus Factor Analysis</h3>
            <p className="text-sm text-muted leading-relaxed">
              Detects critical maintainer concentration where a single developer departure would paralyze an architectural subsystem.
            </p>
          </Card>
          <Card className="p-6">
            <GitMerge className="w-8 h-8 text-[var(--risk)] mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">Architectural Hotspots</h3>
            <p className="text-sm text-muted leading-relaxed">
              Cross-references file modification frequency against AST complexity to highlight bug-prone engineering technical debt.
            </p>
          </Card>
          <Card className="p-6">
            <Activity className="w-8 h-8 text-[var(--healthy)] mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">Organization Velocity</h3>
            <p className="text-sm text-muted leading-relaxed">
              Tracks commit throughput, pull request cadence, and codebase health scores across hundreds of repositories continuously.
            </p>
          </Card>
        </div>
      </section>

      {/* Section 4: AI Insights (ChatGPT Style Preview) */}
      <section className="py-24 bg-[var(--bg-surface)] border-t border-b border-[var(--border-subtle)] px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <Badge variant="healthy" className="mb-3"><Sparkles className="w-3.5 h-3.5 mr-1 inline" /> AI Intelligence</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Conversational Engineering Context</h2>
          <p className="text-muted max-w-2xl mb-12">
            Ask complex architectural questions in plain English. GitPro synthesizes graph data into clear executive recommendations.
          </p>

          <div className="w-full text-left rounded-2xl bg-[var(--bg)] border border-[var(--border)] p-6 md:p-8 shadow-2xl flex flex-col gap-6 font-body">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center font-bold text-xs shrink-0">
                You
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm">
                Why is the Payments Module flagged as a high architectural risk?
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--healthy-bg)] text-[var(--healthy)] flex items-center justify-center font-bold text-xs shrink-0">
                AI
              </div>
              <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm leading-relaxed flex flex-col gap-4">
                <p>
                  The <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--healthy)]">src/payments/processor.ts</code> file exhibits severe maintainer concentration and high churn complexity:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted">
                  <li><strong>Alice</strong> owns <strong>91.4%</strong> of historical commits over the last 180 days.</li>
                  <li>Cyclomatic complexity increased by <strong>42%</strong> over the last 3 sprints.</li>
                  <li>Bus factor is currently <strong>≤ 1</strong> (Critical Risk).</li>
                </ul>
                <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--border-subtle)] flex flex-col gap-1 mt-1">
                  <span className="text-xs font-semibold text-[var(--healthy)] uppercase tracking-wider">Recommended Mitigation</span>
                  <span className="text-xs text-muted">Mandate cross-training code reviews for Bob and Carol on all upcoming payment PRs to decentralize domain knowledge.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Reports Preview */}
      <section className="py-24 px-6 max-w-6xl mx-auto w-full text-center">
        <Badge variant="neutral" className="mb-3">Executive Delivery</Badge>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Exportable Engineering Reports</h2>
        <p className="text-muted max-w-2xl mx-auto mb-16">
          Generate point-in-time snapshots in PDF, Markdown, HTML, or raw JSON. Schedule automated deliveries to Slack or Email.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {['Executive Summary', 'Developer Attribution', 'Organization Scorecard'].map((title, i) => (
            <Card key={i} className="p-6 flex flex-col justify-between hover:border-[var(--healthy)] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-6 h-6 text-muted" />
                  <Badge variant="healthy">PDF / JSON</Badge>
                </div>
                <h4 className="font-display text-lg font-semibold mb-2">{title}</h4>
                <p className="text-xs text-muted leading-relaxed">Automated board-ready summaries formatted with clean typography and data visual breakdowns.</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono text-muted">
                <span>Updated weekly</span>
                <span className="text-[var(--text)] font-semibold">Instant export →</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 & 8: Final CTA */}
      <section className="py-32 bg-radial-gradient from-[rgba(45,212,191,0.1)] to-[var(--bg)] border-t border-[var(--border-subtle)] px-6 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Start understanding your codebase today.
          </h2>
          <p className="text-muted text-lg mb-10 max-w-xl">
            Join engineering leaders from world-class organizations using GitPro to eliminate knowledge silos and mitigate risk.
          </p>

          <form onSubmit={handleAnalyze} className="w-full max-w-xl mb-6">
            <div className="spotlight-bar flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-2 shadow-2xl">
              <Search className="w-6 h-6 text-muted ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Paste GitHub Repository URL..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-transparent border-none text-base font-mono px-4 py-3 text-[var(--text)] placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--healthy)] transition-colors font-display font-semibold text-sm px-5 py-3 rounded-xl"
              >
                Analyze →
              </button>
            </div>
          </form>

          <button onClick={handleGitHubLogin} className="text-sm text-muted hover:text-[var(--text)] transition-colors underline underline-offset-4">
            Or sign in with GitHub OAuth
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border-subtle)] px-6 text-center text-xs text-muted font-mono flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full">
        <span>© 2026 GitPro Inc. All rights reserved.</span>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <span className="hover:text-[var(--text)] cursor-pointer">Privacy</span>
          <span className="hover:text-[var(--text)] cursor-pointer">Security</span>
          <span className="hover:text-[var(--text)] cursor-pointer">API Docs</span>
        </div>
      </footer>

      <AnalysisPipelineModal 
        isOpen={isPipelineOpen} 
        onClose={() => setIsPipelineOpen(false)} 
        repoUrl={repoUrl} 
      />
    </div>
  );
}
