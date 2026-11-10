import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '../icons';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
}

/** How long the close animation runs before the dialog is removed (matches globals.css). */
const CLOSE_MS = 220;
/** How far (px) a sheet must be dragged down on a phone before it closes. */
const SWIPE_CLOSE_PX = 110;

/**
 * Dialog. Centred on larger screens; on phones (≤ 640px, see globals.css) it is a bottom
 * drawer that slides up, can be swiped down by its handle/header, and keeps its buttons
 * pinned at the bottom.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = '620px',
  children,
  footer,
  closeOnOverlayClick = false,
}) => {
  // Keep the dialog mounted briefly after closing so it can animate out.
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    setClosing(true);
    const t = setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on Escape key, lock page scroll while open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Swipe down (from the handle or header) to dismiss on touch screens.
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragDelta = useRef(0);

  const onDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragDelta.current = 0;
    if (contentRef.current) contentRef.current.style.transition = 'none';
  };
  const onDragMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null || !contentRef.current) return;
    dragDelta.current = Math.max(0, e.touches[0].clientY - dragStartY.current);
    contentRef.current.style.transform = `translateY(${dragDelta.current}px)`;
  };
  const onDragEnd = () => {
    if (dragStartY.current === null || !contentRef.current) return;
    const el = contentRef.current;
    dragStartY.current = null;
    el.style.transition = '';
    if (dragDelta.current > SWIPE_CLOSE_PX) {
      el.style.transform = '';
      onClose();
    } else {
      el.style.transform = '';
    }
  };
  const dragHandlers = { onTouchStart: onDragStart, onTouchMove: onDragMove, onTouchEnd: onDragEnd };

  if (!rendered) return null;

  return (
    <div
      className={`modal-overlay ${closing ? 'is-closing' : ''}`.trim()}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-grab" aria-hidden {...dragHandlers} />
        <div className="modal-header" {...dragHandlers}>
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && (
          <div
            className="modal-footer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '16px',
              marginTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
