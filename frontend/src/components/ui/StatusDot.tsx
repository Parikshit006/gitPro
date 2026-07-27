/* ============================================================
   GitPro — Status Dot Component
   ============================================================ */

import { type StatusVariant, getVariantColor } from '../../lib/statusColors';

interface StatusDotProps {
  variant: StatusVariant;
  pulsing?: boolean;
}

export function StatusDot({ variant, pulsing = false }: StatusDotProps) {
  const color = getVariantColor(variant);
  
  return (
    <span 
      style={{ 
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: pulsing ? `0 0 8px ${color}` : 'none'
      }}
      className={pulsing ? 'pulse-sync' : ''}
      aria-hidden="true"
    />
  );
}
