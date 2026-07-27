import { useState } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, ShieldAlert, GitBranch, Loader2, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAIChat, useAIStatus } from '../hooks/useAI';
import { useRepositories } from '../hooks/useRepositories';
import type { AIChatMessage } from '../lib/types';
import './AIPage.css';

const SUGGESTED_PROMPTS = [
  {
    title: 'Analyze bus factor risk in src/payments',
    prompt: 'Explain why the payments processing module has a bus factor of ≤ 1 and recommend mitigation strategies for Alice.',
    badge: 'Critical Risk',
  },
  {
    title: 'Summarize top maintainer knowledge silos',
    prompt: 'List all developers who own greater than 80% of historical commits in any architectural subsystem over the last sprint.',
    badge: 'Ownership',
  },
  {
    title: 'Evaluate hotspot churn vs complexity',
    prompt: 'Analyze high-frequency file modification hotspots in the repository and identify refactoring priorities.',
    badge: 'Hotspots',
  },
  {
    title: 'Generate executive weekly summary',
    prompt: 'Synthesize organizational commit velocity, active contributor trends, and overall repository health scorecard for leadership review.',
    badge: 'Executive Brief',
  },
];

export default function AIPage() {
  const [input, setInput] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      content: 'Hello! I am your GitPro Engineering Intelligence Assistant. I have indexed your repository commit graphs, AST complexity metrics, and developer ownership patterns. How can I help you analyze your engineering organization today?',
      timestamp: 'Just now',
      riskLevel: 'HEALTHY',
    },
  ]);

  const { data: status, isLoading: isStatusLoading, refetch: refetchStatus } = useAIStatus();
  const { data: reposData } = useRepositories();
  const { mutate: sendChat, isPending } = useAIChat();

  const repos = reposData || [];

  const handleSend = (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isPending) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');

    const contextualPrompt = selectedRepoId !== 'all' 
      ? `[Repository Context: ${repos.find((r: any) => r.id === selectedRepoId)?.name || selectedRepoId}]\n${promptToSend}`
      : promptToSend;

    sendChat(
      { prompt: contextualPrompt },
      {
        onSuccess: (res) => {
          const aiMsg: AIChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            content: res.content || 'Analysis complete.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            riskLevel: res.content.toLowerCase().includes('critical') ? 'CRITICAL' : 'HEALTHY',
          };
          setMessages((prev) => [...prev, aiMsg]);
        },
        onError: (err) => {
          const errMsg: AIChatMessage = {
            id: `err-${Date.now()}`,
            sender: 'ai',
            content: `Execution error: ${err.message || 'Provider connection failed.'}. Attempting vendor fallback...`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            riskLevel: 'CRITICAL',
          };
          setMessages((prev) => [...prev, errMsg]);
        },
      }
    );
  };

  return (
    <div className="ai-page flex flex-col h-[calc(100vh-65px)] bg-[var(--bg)] font-body">
      
      {/* Top Bar Context & Telemetry */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--healthy-bg)] text-[var(--healthy)]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">AI Intelligence Hub</h1>
            <span className="text-xs text-muted font-mono">Conversational AST & Commit Graph Reasoning</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Repository Selector */}
          <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs">
            <GitBranch className="w-3.5 h-3.5 text-muted" />
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="bg-transparent border-none text-[var(--text)] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[var(--bg-surface)]">All Tracked Repositories</option>
              {repos.map((r: any) => (
                <option key={r.id} value={r.id} className="bg-[var(--bg-surface)]">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Telemetry Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-[var(--healthy)]" />
            <span>{isStatusLoading ? 'Checking...' : `${status?.provider || 'MOCK'} (${status?.modelName || 'v1'})`}</span>
            <button onClick={() => refetchStatus()} title="Refresh Telemetry">
              <RefreshCw className="w-3 h-3 text-muted hover:text-[var(--text)] transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Chat Feed */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  msg.sender === 'user'
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--healthy)]'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col gap-2 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-tr-sm'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text)] rounded-tl-sm shadow-md'
                  }`}>
                    {msg.content}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted px-1">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && msg.riskLevel && (
                      <Badge variant={msg.riskLevel === 'CRITICAL' ? 'critical' : 'healthy'}>
                        {msg.riskLevel}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--healthy)] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-muted flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--healthy)]" />
                  <span>Synthesizing AST complexity and commit history graphs...</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Input Area */}
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              
              {/* Suggested Quick Prompts Grid (When only 1 welcome msg exists) */}
              {messages.length <= 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  {SUGGESTED_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      disabled={isPending}
                      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)] hover:border-[var(--healthy)] hover:bg-[var(--bg-hover)] transition-all text-left flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-[var(--text)] group-hover:text-[var(--healthy)] transition-colors">{item.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-muted border border-[var(--border-subtle)]">{item.badge}</span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2">{item.prompt}</p>
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-1.5 focus-within:border-[var(--healthy)] transition-colors shadow-lg"
              >
                <input
                  type="text"
                  placeholder="Ask a question about ownership, bus factor, architecture, or hotspots..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isPending}
                  className="flex-1 bg-transparent border-none text-sm font-body px-4 py-2.5 text-[var(--text)] placeholder:text-muted focus:outline-none disabled:opacity-50"
                />
                <Button type="submit" variant="primary" disabled={!input.trim() || isPending} className="rounded-xl px-4">
                  <Send className="w-4 h-4 mr-1.5" /> Send
                </Button>
              </form>
              <span className="text-[11px] text-center text-muted font-mono">
                AI Intelligence is computed deterministically from historical git commits and AST structures.
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Telemetry & Prompt Versioning (Desktop only) */}
        <div className="w-80 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex flex-col gap-6 overflow-y-auto hidden xl:flex shrink-0">
          <div>
            <h3 className="font-display font-semibold text-sm mb-1 text-[var(--text)]">Provider Telemetry</h3>
            <p className="text-xs text-muted">Active execution parameters and retry strategies.</p>
          </div>

          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)] font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Provider Type</span>
              <span className="font-semibold text-[var(--healthy)]">{status?.provider || 'MOCK'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Model Name</span>
              <span className="font-semibold text-[var(--text)]">{status?.modelName || 'v1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Timeout Limit</span>
              <span className="font-semibold text-[var(--text)]">{status?.timeoutMs || 15000}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Retry Strategy</span>
              <span className="font-semibold text-[var(--text)]">Exponential ({status?.retries || 2}x)</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border-subtle)] pt-2 mt-1">
              <span className="text-muted">Vendor Fallback</span>
              <span className="font-semibold text-muted">{status?.fallbackProvider || 'MOCK'}</span>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-sm mb-1 text-[var(--text)]">Prompt Versioning</h3>
            <p className="text-xs text-muted mb-3">Auditable version tags attached to all responses.</p>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-muted">Prompt Tag</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text)]">{status?.promptVersion || 'v1.0.0'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-muted">Response Tag</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text)]">{status?.responseVersion || 'v1.0.0'}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <ShieldAlert className="w-4 h-4 text-[var(--healthy)]" />
              <span>Zero Git Exfiltration</span>
            </div>
            <p className="text-muted leading-relaxed">
              Raw source code is never sent to external LLMs. Only anonymized AST metadata, file names, and commit statistical aggregations are processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
