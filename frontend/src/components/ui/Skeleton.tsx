/* ============================================================
   GitPro — Skeleton Component
   ============================================================ */

import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ className = '', width, height, circle }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{
        width,
        height,
      }}
    />
  );
}
