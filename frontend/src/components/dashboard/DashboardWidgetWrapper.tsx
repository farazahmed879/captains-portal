import React from 'react';
import { Button } from '../ui';
import { CloseIcon } from '../icons';
import styles from './DashboardWidgetWrapper.module.css';

export interface DashboardWidgetWrapperProps {
  title: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  selector?: React.ReactNode;
  onRemove?: () => void;
  removeTitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardWidgetWrapper: React.FC<DashboardWidgetWrapperProps> = ({
  title,
  icon,
  iconBg = '#e0f2fe',
  iconColor = '#0369a1',
  selector,
  onRemove,
  removeTitle = 'Remove Widget',
  footer,
  children,
  className = '',
}) => {
  return (
    <div className={`dashboard-widget-card ${className}`.trim()}>
      <div className="widget-card-header">
        <div className={`widget-card-title-group ${styles.titleGroup}`}>
          <div
            className="widget-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            {icon}
          </div>
          <div className={styles.titleCol}>
            <h3 className={`widget-card-title ${styles.title}`}>
              {title}
            </h3>
          </div>

          {selector && (
            <div className={styles.selectorContainer}>
              {selector}
            </div>
          )}
        </div>

        {onRemove && (
          <div className="widget-card-actions">
            <Button
              variant="secondary"
              size="sm"
              isIconOnly
              className="widget-remove-btn"
              onClick={onRemove}
              title={removeTitle}
              icon={<CloseIcon size={14} />}
            />
          </div>
        )}
      </div>

      <div className="widget-card-body">{children}</div>

      {footer && <div className="widget-card-footer">{footer}</div>}
    </div>
  );
};
