'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { fetchApi } from '../../lib/api';
import { showToast } from '../../lib/alerts';
import { BackButton } from '../../components/BackButton';
import { getUserRoleLabel } from '../../constants';

const sectionTitle: React.CSSProperties = { fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 };
const sectionHint: React.CSSProperties = { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' };
const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '20px 22px',
  marginBottom: '16px',
};
const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '14px',
  marginTop: '16px',
};

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();

  const [details, setDetails] = useState({ name: '', email: '', phone: '' });
  const [savingDetails, setSavingDetails] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) setDetails({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  const detailsChanged =
    !!user &&
    (details.name.trim() !== (user.name || '') ||
      details.email.trim().toLowerCase() !== (user.email || '').toLowerCase() ||
      details.phone.trim() !== (user.phone || ''));

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      const res = await fetchApi<{ success: boolean; message?: string }>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
        }),
      });
      if (res.success) {
        await refreshUser();
        showToast.success('Your profile has been updated.');
      } else {
        showToast.error(res.message || 'Could not update your profile.');
      }
    } catch {
      showToast.error('Could not update your profile.');
    } finally {
      setSavingDetails(false);
    }
  };

  const passwordError =
    passwords.next && passwords.next.length < 6
      ? 'At least 6 characters.'
      : passwords.confirm && passwords.confirm !== passwords.next
      ? 'Passwords do not match.'
      : '';
  const canChangePassword = !!passwords.current && !!passwords.next && !!passwords.confirm && !passwordError;

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChangePassword) return;
    setSavingPassword(true);
    try {
      const res = await fetchApi<{ success: boolean; message?: string }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
      });
      if (res.success) {
        setPasswords({ current: '', next: '', confirm: '' });
        showToast.success('Your password has been changed.');
      } else {
        showToast.error(res.message || 'Could not change your password.');
      }
    } catch {
      showToast.error('Could not change your password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading || !user) {
    return (
      <>
        <Header title="My Profile" />
        <div className="content-body" style={{ color: 'var(--text-muted)' }}>Loading…</div>
      </>
    );
  }

  const initials = (user.name || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Header title="My Profile" />

      <div className="content-body" style={{ maxWidth: '880px' }}>
        <div style={{ marginBottom: '16px' }}>
          <BackButton href="/" label="Back to Dashboard" />
        </div>

        {/* Identity */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{user.name}</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {getUserRoleLabel(user.role)}
              {user.player?.jerseyNumber ? ` · #${user.player.jerseyNumber}` : ''}
            </div>
          </div>
        </div>

        {/* Editable details */}
        <form style={card} onSubmit={saveDetails}>
          <h2 style={sectionTitle}>Your details</h2>
          <div style={sectionHint}>Your name, and the email or phone you sign in with.</div>
          <div style={row}>
            <Input
              label="Full name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={details.phone}
              placeholder="e.g. 0300-1234567"
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
            {detailsChanged && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDetails({ name: user.name || '', email: user.email || '', phone: user.phone || '' })}
              >
                Discard
              </Button>
            )}
            <Button type="submit" variant="primary" loading={savingDetails} disabled={!detailsChanged}>
              Save changes
            </Button>
          </div>
        </form>

        {/* Read-only account info */}
        <div style={card}>
          <h2 style={sectionTitle}>Account</h2>
          <div style={sectionHint}>Your role is set by an admin.</div>
          <div style={{ ...row, fontSize: '13.5px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Role</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{getUserRoleLabel(user.role)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Player profile</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>
                {user.playerId ? (
                  <Link href={`/players/${user.playerId}`} style={{ color: 'var(--text-primary)' }}>
                    {user.player?.name || 'View player profile'}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Not linked</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <form style={card} onSubmit={savePassword}>
          <h2 style={sectionTitle}>Change password</h2>
          <div style={sectionHint}>Enter your current password to set a new one.</div>
          <div style={row}>
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={passwords.confirm}
              error={passwordError || undefined}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
            <Button type="submit" variant="primary" loading={savingPassword} disabled={!canChangePassword}>
              Update password
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
