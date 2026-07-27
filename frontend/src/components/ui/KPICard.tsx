/* ============================================================
   GitPro — KPI Card Component
   ============================================================ */

import { Card, CardHeader, CardTitle, CardContent } from './Card';
import type { LucideIcon } from 'lucide-react';
import { Badge } from './Badge';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isGood: boolean;
  };
  statusText?: string;
  statusVariant?: 'healthy' | 'risk' | 'critical' | 'neutral';
}

export function KPICard({ title, value, icon: Icon, trend, statusText, statusVariant }: KPICardProps) {
  return (
    <Card className="flex flex-col justify-between h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start text-muted">
          <CardTitle className="text-sm font-body font-medium">{title}</CardTitle>
          <Icon className="w-4 h-4 opacity-70" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="flex items-end gap-3 mb-2">
          <div className="text-4xl font-display font-semibold text-text">
            {value}
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium pb-1 ${trend.isGood ? 'text-[var(--healthy)]' : 'text-[var(--critical)]'}`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        
        {(statusText || trend) && (
          <div className="text-sm text-muted font-body mt-2 flex items-center justify-between">
            <span>{trend?.label || 'Total across all repositories'}</span>
            {statusText && statusVariant && (
              <Badge variant={statusVariant}>{statusText}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
