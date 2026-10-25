'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../lib/auth';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
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

interface RegisterFormValues {
  name: string;
  phone: string;
  email?: string;
  teamName?: string;
  password: string;
  confirmPassword?: string;
  agreeTerms?: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      teamName: '',
      password: '',
      confirmPassword: '',
      agreeTerms: true,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    if (values.confirmPassword && values.password !== values.confirmPassword) {
      setServerError('Passwords do not match.');
      return;
    }

    const result = await registerUser({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      password: values.password,
      teamName: values.teamName?.trim() || undefined,
    });

    if (result.success) {
      window.location.href = '/';
    } else {
      setServerError(result.message || 'Registration failed. Please check your details.');
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
        actionText="Already have an account?"
        actionLinkText="Sign in"
        actionHref="/login"
      />

      {/* Main Split Layout */}
      <main className="auth-split-body">
        {/* Left Presentation Hero */}
        <AuthHero
          eyebrow="Built For Cricket Captains & Clubs"
          title={
            <>
              Take command of <br />
              your cricket squad.
            </>
          }
          description="Register your team in seconds: manage your 11-player rosters, track match fees per player, control tournament budgets, and generate transparent financial ledgers."
          badges={[
            { icon: <Trophy size={13} color="#38bdf8" />, text: 'New Club Workspace Setup' },
            { icon: <Users size={13} color="#94a3b8" />, text: 'Player Rosters & Ledgers' },
          ]}
          bottomText="Zero spreadsheets. 100% financial clarity."
        />

        {/* Right Form Card */}
        <AuthCard
          title="Create your account."
          subtitle="Set up your captain profile and start managing your cricket team."
          error={serverError}
          footerPrompt={
            <div className="auth-switch-prompt" style={{ marginTop: '10px' }}>
              <span>Already have an account?</span>
              <Link href="/login" className="auth-switch-link">
                Sign in
              </Link>
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Row 1: Name & Phone */}
            <div className="auth-grid-2">
              <AuthInput
                label="Captain / Manager Name"
                placeholder="e.g. Faraz Shaikh"
                autoComplete="name"
                autoFocus
                required
                icon={<User size={15} />}
                error={errors.name?.message}
                {...register('name', { required: 'Please enter your name' })}
              />

              <AuthInput
                label="Phone Number"
                placeholder="0300-1234567"
                autoComplete="tel"
                required
                icon={<Phone size={15} />}
                error={errors.phone?.message}
                {...register('phone', { required: 'Phone is required' })}
              />
            </div>

            {/* Row 2: Club / Team Name & Email Address */}
            <div className="auth-grid-2">
              <AuthInput
                label="Club / Team Name"
                placeholder="Gulzar Cricket Club"
                icon={<Shield size={15} />}
                {...register('teamName')}
              />

              <AuthInput
                label="Email address (Optional)"
                type="email"
                placeholder="captain@cricket.example"
                autoComplete="email"
                icon={<Mail size={15} />}
                {...register('email')}
              />
            </div>

            {/* Row 3: Password */}
            <AuthInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Choose a strong password (min 6 chars)"
              autoComplete="new-password"
              required
              icon={<Lock size={15} />}
              error={errors.password?.message}
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
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />

            {/* Terms Checkbox */}
            <AuthCheckbox
              label="I agree to sports portal fair-play ledger terms"
              containerStyle={{ marginTop: '2px', marginBottom: '8px' }}
              {...register('agreeTerms')}
            />

            {/* Submit Button */}
            <AuthButton
              type="submit"
              id="register-submit-btn"
              isLoading={isSubmitting}
              loadingText="Creating account..."
              iconRight={<ArrowRight size={15} />}
            >
              Create Account & Start Team
            </AuthButton>
          </form>
        </AuthCard>
      </main>

      {/* Bottom Legal Footer */}
      <AuthFooter />
    </div>
  );
}
