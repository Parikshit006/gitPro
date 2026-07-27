/* ============================================================
   GitPro — Tabs Component
   ============================================================ */

import React, { useState } from 'react';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ items, defaultTabId, onChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTabId || items[0]?.id);

  if (!items || items.length === 0) return null;

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onChange) {
      onChange(id);
    }
  };

  const activeContent = items.find(item => item.id === activeTab)?.content;

  return (
    <div className={`tabs-container ${className}`}>
      <div className="tabs-list" role="tablist">
        {items.map(item => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              id={`tab-${item.id}`}
              className={`tabs-trigger font-body ${isActive ? 'tabs-trigger-active' : ''}`}
              onClick={() => handleTabClick(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      
      <div 
        className="tabs-content"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeContent}
      </div>
    </div>
  );
}
