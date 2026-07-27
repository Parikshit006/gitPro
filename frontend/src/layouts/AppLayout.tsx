/* ============================================================
   GitPro — App Layout (Master Vision Architecture)
   ============================================================ */

import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, GitBranch, FileBarChart, Menu, X, LogOut, Search, Sparkles, Settings, Command } from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';
import { CommandPalette } from '../components/CommandPalette';
import { OnboardingModal } from '../components/OnboardingModal';
import { useRepositories } from '../hooks/useRepositories';
import './AppLayout.css';

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { data: repos, isLoading: isReposLoading } = useRepositories();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Repositories', href: '/repositories', icon: GitBranch },
    { name: 'Search Hub', href: '/search', icon: Search },
    { name: 'AI Assistant', href: '/ai', icon: Sparkles },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    window.location.href = '/login';
  };

  const showOnboarding = !isReposLoading && repos?.length === 0 && !isOnboardingDismissed && location.pathname === '/dashboard';

  return (
    <div className="app-layout flex min-h-screen bg-[var(--bg)] text-[var(--text)] font-body">
      
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-7 h-7 rounded-lg bg-[var(--text)] text-[var(--bg)] flex items-center justify-center font-display font-bold text-sm">G</div>
          <h1 className="font-display font-bold">GitPro</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar glass-card flex flex-col justify-between ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="flex flex-col gap-6">
          <div className="sidebar-header flex items-center justify-between px-4 pt-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--text)] text-[var(--bg)] flex items-center justify-center font-display font-bold text-lg shadow-md">
                G
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg leading-none">GitPro</span>
                <span className="text-[10px] font-mono text-[var(--healthy)] tracking-wider">ENTERPRISE</span>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-nav px-3 flex flex-col gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => 
                    `sidebar-link font-body flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive 
                        ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-md' 
                        : 'text-muted hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                    }`
                  }
                >
                  <Icon className="sidebar-icon w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer p-3 border-t border-[var(--border-subtle)] flex flex-col gap-2">
          {/* Quick Command Palette Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)] text-xs text-muted hover:text-[var(--text)] hover:border-[var(--border)] transition-all"
          >
            <span className="flex items-center gap-2"><Command className="w-3.5 h-3.5" /> Spotlight</span>
            <kbd className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Ctrl+K</kbd>
          </button>

          <button className="sidebar-link font-body logout-btn flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-muted hover:text-[var(--critical)] hover:bg-[var(--bg-hover)] transition-all w-full text-left" onClick={handleLogout}>
            <LogOut className="sidebar-icon w-4 h-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content flex-1 flex flex-col min-w-0 bg-[var(--bg)]">
        
        {/* Top Navbar Header (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-full flex items-center justify-between bg-[var(--bg)] border border-[var(--border-subtle)] hover:border-[var(--border)] rounded-xl px-3.5 py-1.5 text-xs text-muted hover:text-[var(--text)] transition-all shadow-inner"
            >
              <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Search intelligence graph...</span>
              <kbd className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Ctrl+K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter />
            
            <div 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)] cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center font-display font-bold text-xs text-[var(--healthy)] group-hover:border-[var(--healthy)] transition-colors">
                E
              </div>
              <span className="text-xs font-medium text-muted group-hover:text-[var(--text)] transition-colors">eng-lead</span>
            </div>
          </div>
        </header>

        <div className="page-container flex-1">
          <Outlet />
        </div>
      </main>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <OnboardingModal isOpen={Boolean(showOnboarding)} onClose={() => setIsOnboardingDismissed(true)} />
    </div>
  );
}
