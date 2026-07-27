/* ============================================================
   GitPro — Input Component
   ============================================================ */

import React, { forwardRef } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && <label className="input-label font-body">{label}</label>}
        
        <div className="input-container">
          {icon && <div className="input-icon">{icon}</div>}
          <input
            ref={ref}
            className={`input-field font-body ${icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`}
            {...props}
          />
        </div>

        {error && <p className="input-error font-body">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
