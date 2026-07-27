/* ============================================================
   GitPro — Health Gauge Component
   ============================================================ */

import { useEffect, useState } from 'react';
import { getHealthVariant, getVariantColor } from '../../lib/statusColors';

interface HealthGaugeProps {
  score: number;
  size?: number;
}

export function HealthGauge({ score, size = 200 }: HealthGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    // Basic animation
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Arc is 75% of a full circle
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (animatedScore / 100) * arcLength;
  
  const variant = getHealthVariant(score);
  const color = getVariantColor(variant);

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        style={{ transform: 'rotate(135deg)' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-surface)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s var(--ease-out)' }}
        />
      </svg>
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          paddingTop: '20px'
        }}
      >
        <span className="font-display text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="font-body text-sm text-muted">Health Score</span>
      </div>
    </div>
  );
}
