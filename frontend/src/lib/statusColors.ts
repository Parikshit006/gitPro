/* ============================================================
   GitPro — Status Color Utility
   
   Single shared utility for mapping health scores, risk levels,
   and repository statuses to design system color tokens.
   
   Never duplicate this logic anywhere else in the codebase.
   ============================================================ */

import type { RiskLevel, RepositoryStatus } from './types';

export type StatusVariant = 'healthy' | 'risk' | 'critical';

/* ── Health Score → Variant ── */

export function getHealthVariant(score: number): StatusVariant {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'risk';
  return 'critical';
}

export function getHealthLabel(score: number): string {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

/* ── Risk Level → Variant ── */

export function getRiskVariant(level: RiskLevel): StatusVariant {
  switch (level) {
    case 'HEALTHY':
    case 'LOW':
      return 'healthy';
    case 'MEDIUM':
      return 'risk';
    case 'HIGH':
    case 'CRITICAL':
      return 'critical';
  }
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'HEALTHY': return 'Healthy';
    case 'LOW': return 'Low Risk';
    case 'MEDIUM': return 'Medium Risk';
    case 'HIGH': return 'High Risk';
    case 'CRITICAL': return 'Critical';
  }
}

/* ── Repository Status → Variant ── */

export function getRepoStatusVariant(status: RepositoryStatus): StatusVariant {
  switch (status) {
    case 'READY':
      return 'healthy';
    case 'REGISTERED':
    case 'SYNCING':
      return 'risk';
    case 'FAILED':
      return 'critical';
  }
}

export function getRepoStatusLabel(status: RepositoryStatus): string {
  switch (status) {
    case 'REGISTERED': return 'Registered';
    case 'SYNCING': return 'Syncing';
    case 'READY': return 'Ready';
    case 'FAILED': return 'Failed';
  }
}

/* ── CSS Variable Resolver ── */

export function getVariantColor(variant: StatusVariant): string {
  switch (variant) {
    case 'healthy': return 'var(--healthy)';
    case 'risk': return 'var(--risk)';
    case 'critical': return 'var(--critical)';
  }
}

export function getVariantBg(variant: StatusVariant): string {
  switch (variant) {
    case 'healthy': return 'var(--healthy-bg)';
    case 'risk': return 'var(--risk-bg)';
    case 'critical': return 'var(--critical-bg)';
  }
}

/* ── CSS class name helpers ── */

export function getVariantClassName(variant: StatusVariant): string {
  return `status-${variant}`;
}

export function getVariantBgClassName(variant: StatusVariant): string {
  return `status-bg-${variant}`;
}
