/* ============================================================
   GitPro — Error State Component
   ============================================================ */

import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import './ErrorState.css';

interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  details, 
  onRetry 
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="error-state">
      <div className="error-state-header">
        <div className="error-state-icon-wrapper">
          <AlertCircle className="error-state-icon" />
        </div>
        <div>
          <h3 className="error-state-title font-display">{title}</h3>
          <p className="error-state-message font-body">{message}</p>
        </div>
      </div>

      <div className="error-state-actions">
        {onRetry && (
          <Button variant="danger" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        )}
        
        {details && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Hide details' : 'Show details'}
          </Button>
        )}
      </div>

      {details && showDetails && (
        <div className="error-state-details">
          <pre className="font-mono">{details}</pre>
        </div>
      )}
    </div>
  );
}
