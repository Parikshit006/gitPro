/* ============================================================
   GitPro — App Layout
   ============================================================ */

import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, GitBranch, FileBarChart, Menu, X, LogOut } from 'lucide-react';
import './AppLayout.css';

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Repositories', href: '/repositories', icon: GitBranch },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
  ];

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    // Basic logout - in a real app this might hit a /logout endpoint
    // For now, redirecting to login will clear state (Axios handles cookies)
    window.location.href = '/login';
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h1 className="font-display">GitPro</h1>
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar glass-card ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="font-display">GitPro</h1>
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => 
                  `sidebar-link font-body ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="sidebar-icon" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link font-body logout-btn" onClick={handleLogout}>
            <LogOut className="sidebar-icon" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
