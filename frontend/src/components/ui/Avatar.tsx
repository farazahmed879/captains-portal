import React from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Full name used to derive initials when no label is given */
  name: string;
  /** Optional explicit label (e.g. jersey number "#7") shown instead of initials */
  label?: string;
  size?: AvatarSize;
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const Avatar: React.FC<AvatarProps> = ({
  name,
  label,
  size = 'md',
  className = '',
  ...props
}) => (
  <div className={`avatar avatar-${size} ${className}`.trim()} title={name} {...props}>
    {label || getInitials(name)}
  </div>
);
