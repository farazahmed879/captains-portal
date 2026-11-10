import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * "Back to …" link. Shows the text on larger screens and only an arrow on phones
 * (see .back-btn in globals.css); the label stays available to screen readers and as a tooltip.
 */
export const BackButton: React.FC<{ href: string; label: string }> = ({ href, label }) => (
  <Link href={href} className="btn btn-secondary btn-sm back-btn" aria-label={label} title={label}>
    <ArrowLeft size={16} className="back-btn-icon" aria-hidden />
    <span className="back-btn-label">{label}</span>
  </Link>
);
