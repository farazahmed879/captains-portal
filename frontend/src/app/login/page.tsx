'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { Phone, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(phone.trim(), password);
    setLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.message || 'Invalid credentials. Please verify your phone number.');
    }
  };

  const handleQuickLogin = (demoPhone: string, demoPass: string) => {
    setPhone(demoPhone);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    login(demoPhone, demoPass).then((res) => {
      setLoading(false);
      if (res.success) {
        router.push('/');
      } else {
        setError(res.message || 'Quick login failed.');
      }
    });
  };

  return (
    <div className="login-page">
      <div className="login-backdrop">
        <div className="login-glow glow-emerald" />
        <div className="login-glow glow-blue" />
        <div className="login-glow glow-amber" />
      </div>

      <div className="login-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-icon">CP</div>
          <h1 className="login-brand-title">CAPTAINS PORTAL</h1>
          <p className="login-brand-sub">Sports Team, Matches & Ledger Hub</p>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-title">Sign In</h2>
            <p className="login-subtitle">
              Enter your registered phone number to access your team ledger & matches.
            </p>
          </div>

          {error && (
            <div className="login-error-alert" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-phone">
                Phone Number
              </label>
              <div className="login-input-wrap">
                <Phone size={17} className="login-input-icon" />
                <input
                  id="login-phone"
                  type="text"
                  className="login-input"
                  placeholder="e.g. 0300-1234567 or 03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  autoFocus
                  required
                />
              </div>
              <span className="login-input-hint">
                Pakistan format (03xx) or international (+92) supported
              </span>
            </div>

            <div className="form-group">
              <div className="login-label-row">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <span className="login-optional-tag">Required for Captains</span>
              </div>
              <div className="login-input-wrap">
                <Lock size={17} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter password (admin123 for captain)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-toggle-pw"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Shortcut */}
          <div className="login-divider">
            <span>or 1-click quick demo</span>
          </div>

          <div className="login-quick-actions">
            <button
              type="button"
              id="quick-login-captain"
              className="login-quick-btn"
              onClick={() => handleQuickLogin('0342-2181946', 'admin123')}
            >
              <div className="login-quick-badge">
                <Sparkles size={14} />
              </div>
              <div className="login-quick-content">
                <strong>Log in as Captain (Faraz #04)</strong>
                <span>Phone: 0342-2181946 · Gulzar Cricket Club Admin</span>
              </div>
            </button>
          </div>

          <div className="login-footer-badges">
            <div className="login-badge-item">
              <ShieldCheck size={14} color="#059669" />
              <span>JWT Encrypted Sessions</span>
            </div>
            <div className="login-badge-item">
              <CheckCircle2 size={14} color="#0284c7" />
              <span>Multi-Tenant Sports Database</span>
            </div>
          </div>
        </div>

        <p className="login-copyright">
          © 2026 Captains Sports Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
