import React from 'react';
import Link from 'next/link';
import { ASSETS } from '../../constants';

export const TopbarBrand: React.FC = () => {
  return (
    <Link
      href="/"
      className="header-brand"
      title="Go to Dashboard"
      aria-label="Captains Portal Dashboard"
    >
      <div className="header-brand-icon">
        <img
          src={ASSETS.LOGO}
          alt="Captains Portal Logo"
          className="header-brand-img"
        />
      </div>
      <div className="header-brand-text">
        <span className="header-brand-title">CAPTAINS</span>
        <span className="header-brand-sub">Sports Pro</span>
      </div>
    </Link>
  );
};
