'use client';

import React, { useEffect, useState } from 'react';
import {
  CloseIcon,
  Trash2,
  AlertCircle,
} from '../icons';
import { Button } from './Button';
import { fetchApi } from '../../lib/api';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
  requireDeleteSecurity?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle = 'Action Confirmation Required',
  message = 'This action cannot be undone and will permanently remove this record.',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  isDanger = true,
  loading = false,
  requireDeleteSecurity = false,
}) => {
  const [deleteWord, setDeleteWord] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const isBusy = loading || verifying;
  const isWordMatched = deleteWord.trim().toLowerCase() === 'delete';
  const canSubmit = !requireDeleteSecurity || (isWordMatched && password.trim().length > 0);

  useEffect(() => {
    if (isOpen) {
      setDeleteWord('');
      setPassword('');
      setError('');
      setVerifying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isBusy]);

  if (!isOpen) return null;

  const handleConfirmSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isBusy) return;

    if (!requireDeleteSecurity) {
      onConfirm();
      return;
    }

    if (!isWordMatched) {
      setError('Please type "Delete" in the confirmation box.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your account password to authorize deletion.');
      return;
    }

    setError('');
    setVerifying(true);
    try {
      const res = await fetchApi<{ success: boolean; message?: string }>('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (res && res.success) {
        setVerifying(false);
        onConfirm();
      } else {
        setVerifying(false);
        setError(res?.message || 'Incorrect password. Please enter your valid account password.');
      }
    } catch (err: any) {
      setVerifying(false);
      setError(err?.message || 'Password verification failed. Please try again.');
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1200 }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: '480px', padding: '22px 24px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="modal-header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: isDanger ? '#f1f5f9' : '#f1f5f9',
                color: isDanger ? '#dc2626' : '#475569',
                border: isDanger ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
              }}
            >
              {isDanger ? <Trash2 size={20} /> : <AlertCircle size={20} />}
            </div>
            <div>
              <h2 id="confirm-modal-title" className="modal-title" style={{ fontSize: '17.5px' }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close confirmation modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirmSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '13px 15px',
                borderRadius: '10px',
                background: isDanger ? '#f8fafc' : '#f8fafc',
                border: isDanger ? '1px solid #e2e8f0' : '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '13.5px',
                lineHeight: 1.55,
              }}
            >
              {message}
            </div>

            {requireDeleteSecurity && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '14px 16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Type{' '}
                    <code
                      style={{
                        background: '#f1f5f9',
                        color: '#dc2626',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '12px',
                        userSelect: 'all',
                      }}
                    >
                      Delete
                    </code>{' '}
                    to confirm
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder='Type "Delete" here...'
                    value={deleteWord}
                    onChange={(e) => {
                      setDeleteWord(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isBusy}
                    autoFocus
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      borderColor:
                        deleteWord.length > 0
                          ? isWordMatched
                            ? '#15803d'
                            : '#cbd5e1'
                          : undefined,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    <span>Enter your password</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter account password..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isBusy}
                    style={{ margin: 0, fontSize: '13px' }}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      color: '#dc2626',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
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
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isBusy}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant={isDanger ? 'danger' : 'primary'}
              loading={isBusy}
              disabled={!canSubmit || isBusy}
              style={
                isDanger
                  ? {
                      background: canSubmit ? '#dc2626' : '#cbd5e1',
                      color: '#ffffff',
                      borderColor: canSubmit ? '#dc2626' : '#cbd5e1',
                      boxShadow: canSubmit ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                      cursor: canSubmit && !isBusy ? 'pointer' : 'not-allowed',
                    }
                  : undefined
              }
            >
              {confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
