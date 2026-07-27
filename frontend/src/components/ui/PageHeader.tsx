/* ============================================================
   GitPro — Page Header Component
   ============================================================ */

import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  statusBadge?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions, statusBadge }: PageHeaderProps) {
  return (
    <div className="page-header">
      {breadcrumbs && <div className="page-header-breadcrumbs">{breadcrumbs}</div>}
      
      <div className="page-header-main">
        <div className="page-header-title-group">
          <h1 className="font-display page-header-title">{title}</h1>
          {statusBadge && <div className="page-header-badge">{statusBadge}</div>}
        </div>
        
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      
      {description && <p className="font-body page-header-description">{description}</p>}
    </div>
  );
}
