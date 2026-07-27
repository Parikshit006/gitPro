/* ============================================================
   GitPro — Empty State Component
   ============================================================ */

import type { LucideIcon } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrapper">
        <Icon className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title font-display">{title}</h3>
      <p className="empty-state-description font-body">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
