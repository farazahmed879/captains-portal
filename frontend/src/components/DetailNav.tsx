import React from 'react';
import { BackButton } from './BackButton';

export interface DetailNavProps {
  back: { href: string; label: string };
  /** Page actions shown on the right (Edit, Delete, …). */
  children?: React.ReactNode;
}

/** Top row of a detail page: back button on the left, page actions on the right. */
export const DetailNav: React.FC<DetailNavProps> = ({ back, children }) => (
  <div className="detail-nav">
    <BackButton href={back.href} label={back.label} />
    {children && <div className="action-group">{children}</div>}
  </div>
);
