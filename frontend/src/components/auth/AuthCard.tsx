import React from 'react';

export interface AuthCardProps {
  topIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  error?: string | null;
  children: React.ReactNode;
  footerPrompt?: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  topIcon,
  title,
  subtitle,
  error,
  children,
  footerPrompt,
}) => {
  return (
    <div className="auth-card-col">
      <div className="auth-glass-card">
        {topIcon && <div className="auth-card-top-icon">{topIcon}</div>}

        <div className="auth-card-header">
          <h2 className="auth-card-title">{title}</h2>
          {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
        </div>

        {error && (
          <div
            style={{
              padding: '9px 12px',
              background: 'rgba(225, 29, 72, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '9px',
              color: '#fca5a5',
              fontSize: '11.5px',
              fontWeight: 600,
              marginBottom: '10px',
            }}
            role="alert"
          >
            <span>{error}</span>
          </div>
        )}

        {children}

        {footerPrompt}
      </div>
    </div>
  );
};
