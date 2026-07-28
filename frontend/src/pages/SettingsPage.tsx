import { useState } from 'react';
import { User as UserIcon, Shield, Key, Moon, Sun, Monitor, GitBranch, Check, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth, useLogout } from '../hooks/useAuth';
import './SettingsPage.css';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'api' | 'security'>('profile');
  const [apiKey, setApiKey] = useState('gp_live_89a7f6c5e4d3b2a10987654321');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { data: user } = useAuth();
  const { mutate: logout } = useLogout();

  const handleLogout = () => {
    logout();
  };

  const handleRegenerateKey = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const rand = Math.random().toString(36).substring(2, 12);
      setApiKey(`gp_live_${rand}_${Date.now().toString(36)}`);
      setIsRegenerating(false);
    }, 800);
  };

  return (
    <div className="settings-page flex flex-col min-h-[calc(100vh-65px)] bg-[var(--bg)] font-body">
      
      {/* Top Header */}
      <div className="px-6 py-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-[var(--text)]">Workspace Settings</h1>
            <p className="text-sm text-muted">Manage your engineering identity, OAuth connections, and API access tokens.</p>
          </div>
          <Badge variant="healthy">Production Workspace</Badge>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {[
            { id: 'profile', label: 'Profile & GitHub', icon: UserIcon },
            { id: 'appearance', label: 'Appearance & Theme', icon: Moon },
            { id: 'api', label: 'API Access Tokens', icon: Key },
            { id: 'security', label: 'Security & Sessions', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isSelected
                    ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-md'
                    : 'text-muted hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          
          {activeTab === 'profile' && (
            <>
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>Authenticated Identity</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-4">
                  <div className="flex items-center gap-4">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full border border-[var(--border)] object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center font-display font-bold text-xl text-[var(--healthy)]">
                        {user?.username ? user.username[0].toUpperCase() : 'E'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-semibold text-lg text-[var(--text)]">{user?.email || user?.username || 'engineer@company.com'}</h3>
                      <span className="text-xs font-mono text-muted">{user?.displayName || user?.username || 'Principal Engineering Role'} • Active Session</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-3">
                    <h4 className="font-semibold text-sm">Connected VCS Providers</h4>
                    <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5 text-[var(--healthy)]" />
                        <div>
                          <div className="text-sm font-semibold">GitHub OAuth Organization App</div>
                          <div className="text-xs font-mono text-muted">Connected • Scopes: repo, read:user, read:org</div>
                        </div>
                      </div>
                      <Badge variant="healthy"><Check className="w-3 h-3 inline mr-1" /> Authorized</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'appearance' && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Interface Theme</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-6">
                <p className="text-sm text-muted">
                  GitPro is engineered with an Apple-inspired restrained dark theme by default to reduce visual strain during long architectural reviews.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'dark', label: 'Restrained Dark (Default)', icon: Moon, desc: 'Warm slate dark background with glassmorphic cards.' },
                    { id: 'light', label: 'High Contrast Light', icon: Sun, desc: 'Optimized for outdoor viewing and print presentations.' },
                    { id: 'system', label: 'System Preference', icon: Monitor, desc: 'Automatically syncs with macOS/Windows OS appearance.' },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = theme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setTheme(t.id as any)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                          isSelected
                            ? 'bg-[var(--bg-hover)] border-[var(--healthy)] shadow-[0_0_15px_rgba(45,212,191,0.1)]'
                            : 'bg-[var(--bg)] border-[var(--border-subtle)] hover:border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-[var(--healthy)]' : 'text-muted'}`} />
                          {isSelected && <Check className="w-4 h-4 text-[var(--healthy)]" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{t.label}</h4>
                          <p className="text-[11px] text-muted leading-relaxed">{t.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Personal API Access Token</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-6">
                <p className="text-sm text-muted">
                  Use this live token to authenticate CI/CD pipelines, automated report ingestion scripts, or custom telemetry exporters.
                </p>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono font-semibold text-muted uppercase">Active Production Token</span>
                  <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2 font-mono text-sm text-[var(--healthy)]">
                    <input type="text" readOnly value={apiKey} className="w-full bg-transparent border-none focus:outline-none px-2" />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className="shrink-0 font-mono text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? 'Rolling...' : 'Roll Key'}
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)] text-xs text-muted font-mono">
                  <span>Usage Header:</span> <code className="text-[var(--text)] font-semibold">Authorization: Bearer {apiKey.substring(0, 14)}...</code>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6 border-[rgba(239,68,68,0.2)]">
              <CardHeader>
                <CardTitle className="text-[var(--critical)]">Security & Session Management</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-6">
                <p className="text-sm text-muted">
                  Review active authentication credentials or immediately revoke all active JSON Web Tokens across connected devices.
                </p>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)]">
                  <div>
                    <h4 className="font-semibold text-sm">Sign Out of All Workspace Devices</h4>
                    <p className="text-xs text-muted mt-0.5">Revokes active JWT cookies and requires GitHub re-authentication.</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleLogout} className="shrink-0">
                    <LogOut className="w-4 h-4 mr-1.5" /> Terminate Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
