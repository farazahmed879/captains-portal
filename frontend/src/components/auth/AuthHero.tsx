import React from 'react';
import { ASSETS } from '../../constants';

export interface AuthBadge {
  icon?: React.ReactNode;
  text: string;
}

export interface AuthHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  badges?: AuthBadge[];
  bottomText?: string;
}

export const AuthHero: React.FC<AuthHeroProps> = ({
  eyebrow = 'Built For Cricket Captains & Clubs',
  title,
  description,
  imageSrc = ASSETS.CRICKET_HERO,
  imageAlt = 'Cricket match under stadium floodlights',
  badges = [],
  bottomText = 'Zero spreadsheets. 100% financial clarity.',
}) => {
  return (
    <div className="auth-hero-col">
      {eyebrow && (
        <div className="auth-eyebrow">
          <span className="auth-eyebrow-dot" />
          <span>{eyebrow}</span>
        </div>
      )}

      <h1 className="auth-hero-title">{title}</h1>

      <p className="auth-hero-desc">{description}</p>

      <div className="auth-cricket-illustration-card">
        <img src={imageSrc} alt={imageAlt} className="auth-cricket-img" />
        <div className="auth-cricket-overlay" />
        {badges.length > 0 && (
          <div className="auth-cricket-caption-row">
            {badges.map((badge, idx) => (
              <div key={idx} className="auth-cricket-badge">
                {badge.icon}
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {bottomText && (
        <div className="auth-hero-bottom-text">
          <span>{bottomText}</span>
        </div>
      )}
    </div>
  );
};
