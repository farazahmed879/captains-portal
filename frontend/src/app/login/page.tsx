'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../lib/auth';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import {
  AuthTopbar,
  AuthHero,
  AuthCard,
  AuthInput,
  AuthCheckbox,
  AuthButton,
  AuthFooter,
} from '../../components/auth';

interface LoginFormValues {
  phone: string;
  password?: string;
  rememberMe?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      phone: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    const result = await login(values.phone.trim(), values.password || '');

    if (result.success) {
      window.location.href = '/';
    } else {
      setServerError(result.message || 'Invalid credentials. Please verify your phone number.');
    }
  };

  const handleQuickLogin = async (demoPhone: string, demoPass: string) => {
    setValue('phone', demoPhone);
    setValue('password', demoPass);
    setServerError(null);

    const result = await login(demoPhone, demoPass);
    if (result.success) {
      window.location.href = '/';
    } else {
      setServerError(result.message || 'Quick login failed');
    }
  };

  return (
    <div className="auth-split-page">
      {/* Background glow ambiance */}
      <div className="auth-split-backdrop" aria-hidden="true">
        <div className="auth-glow auth-glow-emerald" />
        <div className="auth-glow auth-glow-blue" />
        <div className="auth-glow auth-glow-amber" />
      </div>

      {/* Top Navbar */}
      <AuthTopbar
        actionText="New captain?"
        actionLinkText="Create account"
        actionHref="/register"
      />

      {/* Main Split Layout */}
      <main className="auth-split-body">
        {/* Left Presentation Hero */}
        <AuthHero
          eyebrow="A Little Clarity. A Lot of Power."
          title={
            <>
              Your cricket squad, <br />
              in a better light.
            </>
          }
          description="A calm, unified space for your cricket team: player ledger, match fees, tournament entry costs, sponsors, and squad scorecards."
          badges={[
            { icon: <Trophy size={13} color="#38bdf8" />, text: 'Gulzar Cricket Club · Season 2026' },
            { icon: <Users size={13} color="#94a3b8" />, text: 'Squad Ledgers' },
          ]}
          bottomText="Less noise. Zero ledger confusion."
        />

        {/* Right Form Card */}
        <AuthCard
          title="Welcome back."
          subtitle="Sign in to your Captains Portal workspace."
          error={serverError}
          footerPrompt={
            <>
              {/* Divider */}
              <div className="auth-divider">
                <span>or quick fill</span>
              </div>

              {/* Quick Demo Button */}
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleQuickLogin('0342-2181946', 'admin123')}
              >
                <ShieldCheck size={15} color="#34d399" />
                <span>Fill Captain Demo Credentials</span>
              </button>

              {/* Switch to Register */}
              <div className="auth-switch-prompt">
                <span>New to Captains Portal?</span>
                <Link href="/register" className="auth-switch-link">
                  Create an account
                </Link>
              </div>

              {/* Demo Fictional Details Box */}
              <div className="auth-demo-box">
                <div className="auth-demo-header">
                  <span>Demo Only · Fictional Details</span>
                  <button
                    type="button"
                    className="auth-demo-fill-btn"
                    onClick={() => handleQuickLogin('0342-2181946', 'admin123')}
                  >
                    Apply
                  </button>
                </div>
                <div className="auth-demo-row">
                  <span>Phone / Email:</span>
                  <strong>0342-2181946</strong>
                </div>
                <div className="auth-demo-row">
                  <span>Password:</span>
                  <strong>admin123</strong>
                </div>
              </div>
            </>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Phone / Identifier Input */}
            <AuthInput
              label="Phone number or Email"
              placeholder="e.g. 0342-2181946 or captain@club.com"
              autoComplete="username tel"
              autoFocus
              icon={<Phone size={15} />}
              error={errors.phone?.message}
              {...register('phone', {
                required: 'Please enter your phone number or email',
                minLength: { value: 5, message: 'Please enter a valid credential' },
              })}
            />

            {/* Password Input */}
            <AuthInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password (admin123 for captain)"
              autoComplete="current-password"
              icon={<Lock size={15} />}
              rightElement={
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              {...register('password')}
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="auth-remember-row">
              <label className="auth-checkbox-label">
                <input type="checkbox" {...register('rememberMe')} />
                <span>Remember me</span>
              </label>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setServerError('Password reset: Contact your club super admin or use captain demo credentials.');
                }}
                className="auth-forgot-link"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <AuthButton
              type="submit"
              id="login-submit-btn"
              isLoading={isSubmitting}
              loadingText="Signing in..."
              iconRight={<ArrowRight size={15} />}
            >
              Sign in
            </AuthButton>
          </form>
        </AuthCard>
      </main>

      {/* Bottom Legal Footer */}
      <AuthFooter />
    </div>
  );
}
