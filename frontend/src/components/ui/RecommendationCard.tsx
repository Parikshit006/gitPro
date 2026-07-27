/* ============================================================
   GitPro — Recommendation Card Component
   ============================================================ */

import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Badge } from './Badge';
import { getRiskVariant, getRiskLabel } from '../../lib/statusColors';
import type { Recommendation } from '../../lib/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader className="flex justify-between items-start pb-0">
        <CardTitle className="text-base">{recommendation.title}</CardTitle>
        <Badge variant={getRiskVariant(recommendation.riskLevel)}>
          {getRiskLabel(recommendation.riskLevel)}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <p className="mb-4">{recommendation.description}</p>
        
        {recommendation.actionItems && recommendation.actionItems.length > 0 && (
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider text-[var(--text)] mb-2">Action Items</h5>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              {recommendation.actionItems.map((item, idx) => (
                <li key={idx} className="text-muted">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
