'use client';

import { signIn } from 'next-auth/react';
import { AppShell } from '@/components/layout/AppShell';
import { OAuthButton } from '@/components/ui/OAuthButton';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Star } from 'lucide-react';
import React, { useState, useRef } from 'react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSignIn() {
    const emailInput = formRef.current?.elements.namedItem('email') as HTMLInputElement;
    const passwordInput = formRef.current?.elements.namedItem('password') as HTMLInputElement;
    const email = emailInput?.value ?? '';
    const password = passwordInput?.value ?? '';

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use NextAuth signIn to establish a proper session cookie that
      // the middleware can verify. This sets the next-auth.session-token cookie.
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        return;
      }

      if (!result?.ok) {
        setError('Something went wrong. Please try again.');
        return;
      }

      // Navigate to dashboard - middleware will now allow it (has session cookie)
      window.location.href = '/dashboard';
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell hideTopBar hideBottomBar hideSidebar>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div
          className="
            w-full max-w-sm
            rounded-[var(--radius-lg)]
            bg-[var(--color-surface)]
            border border-[var(--color-border)]
            shadow-[var(--shadow-overlay)]
            p-6 sm:p-8
          "
        >
          <div
            className="
              w-10 h-10 rounded-[var(--radius-md)]
              bg-[var(--color-accent)]
              flex items-center justify-center
              mx-auto
            "
          >
            <Star className="h-5 w-5 fill-white text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)] mt-6 text-center">
            Welcome back
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1 mb-6 text-center">
            Sign in to continue planning with Trip Planner
          </p>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-2.5 mb-5">
            <OAuthButton provider="google" />
            <OAuthButton provider="facebook" />
            <OAuthButton provider="apple" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] whitespace-nowrap">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Email + Password form */}
          <form
            ref={formRef}
            onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}
          >
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                required
              />
            </FormField>

            <FormField label="Password" htmlFor="password" className="mt-3">
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-[var(--color-text-muted)]
                    hover:text-[var(--color-text-secondary)]
                    transition-colors
                  "
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            {/* Forgot password link */}
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-[var(--text-sm)] text-[var(--color-accent)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                mt-4 w-full
                bg-[var(--color-accent)] text-white
                h-11 rounded-[var(--radius-sm)]
                text-[var(--text-base)] font-semibold
                flex items-center justify-center gap-2
                btn-press
                hover:bg-[var(--color-accent-hover)]
                transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed
              "
              style={{ transition: 'background 150ms ease, transform 80ms var(--ease-spring)' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>

            {/* Error message */}
            {error && (
              <p className="mt-2 text-center text-[var(--text-sm)] text-[var(--color-error)]">{error}</p>
            )}
          </form>

          {/* Quick login buttons for test users */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] text-center mb-3">
              Quick login for testing:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Test User', email: 'test@example.com' },
                { label: 'Sarah Chen', email: 'sarah@example.com' },
                { label: 'Mike Johnson', email: 'mike@example.com' },
                { label: 'Emma Wilson', email: 'emma@example.com' },
              ].map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => {
                    const emailInput = formRef.current?.elements.namedItem('email') as HTMLInputElement;
                    const passwordInput = formRef.current?.elements.namedItem('password') as HTMLInputElement;
                    if (emailInput && passwordInput) {
                      emailInput.value = user.email;
                      passwordInput.value = 'password123';
                    }
                    handleSignIn();
                  }}
                  className="
                    py-2 px-3
                    border border-dashed border-[var(--color-border)]
                    bg-transparent text-[var(--color-text-secondary)]
                    rounded-[var(--radius-sm)]
                    text-[var(--text-xs)]
                    hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]
                    transition-colors
                  "
                >
                  {user.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sign up link */}
          <p className="mt-5 text-center text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-[var(--color-accent)] font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
