/* ============================================================
   GitPro — Badge Component
   ============================================================ */

import React from 'react';
import './Badge.css';
import { type StatusVariant, getVariantClassName, getVariantBgClassName } from '../../lib/statusColors';

interface BadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant | 'neutral';
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'neutral', className = '', dot = false }: BadgeProps) {
  const baseClass = 'badge';
  
  let colorClass = '';
  let bgClass = '';
  
  if (variant !== 'neutral') {
    colorClass = getVariantClassName(variant);
    bgClass = getVariantBgClassName(variant);
  } else {
    colorClass = 'text-muted';
    bgClass = 'badge-bg-neutral';
  }

  return (
    <span className={`${baseClass} ${colorClass} ${bgClass} ${className}`}>
      {dot && <span className="badge-dot" style={{ backgroundColor: 'currentColor' }} />}
      {children}
    </span>
  );
}
