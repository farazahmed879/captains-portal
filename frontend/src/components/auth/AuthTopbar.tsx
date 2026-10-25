import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { ASSETS } from '../../constants';

export interface AuthTopbarProps {
  actionText?: string;
  actionLinkText?: string;
  actionHref?: string;
  showHelpLink?: boolean;
}

export const AuthTopbar: React.FC<AuthTopbarProps> = ({
  actionText = 'Already have an account?',
  actionLinkText = 'Sign in',
  actionHref = '/login',
  showHelpLink = true,
}) => {
  return (
    <header className="auth-topbar">
      <Link href="/" className="auth-topbar-brand">
        <div className="auth-brand-badge">
          <img
            src={ASSETS.LOGO}
            alt="Captains Portal Logo"
            className="auth-brand-img"
          />
        </div>
        <span className="auth-brand-name">Captains Portal</span>
      </Link>

      <div className="auth-topbar-right">
        {actionHref && (
          <Link href={actionHref} className="auth-help-link">
            <span>{actionText}</span>
            <strong>{actionLinkText}</strong>
          </Link>
        )}
        {showHelpLink && (
          <a
            href="mailto:support@captainsportal.local"
            className="auth-help-link"
            style={{ marginLeft: '12px' }}
          >
            <span>Need a hand?</span>
            <strong>Get help</strong>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </header>
  );
};
