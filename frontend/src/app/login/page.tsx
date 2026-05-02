'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { Compass, Mail, Lock, User, ArrowRight, Gift, Loader, MapPin, Users, Wallet, MessageCircle } from 'lucide-react';

// Simple OAuth button icons (SVG)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isLoading } = useAuth();

  const inviteCode = searchParams.get('invite');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      setIsLogin(false);
    }
  }, [inviteCode]);

  // Session validation: redirect to dashboard if user already has valid session
  useEffect(() => {
    const token = localStorage.getItem('next-auth.session-token');
    if (!token) return;

    setIsValidatingSession(true);

    // Race getCurrentUser against a 5-second timeout
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 5000)
    );

    Promise.race([
      api.getCurrentUser(),
      timeout,
    ])
      .then((result) => {
        if (result && result.data) {
          router.push('/dashboard');
        }
        // If timeout (result is null) or no data, fall through to finally
      })
      .catch(() => {
        // Invalid session — clear and stay on login
        localStorage.removeItem('next-auth.session-token');
        localStorage.removeItem('next-auth.csrf-token');
      })
      .finally(() => {
        setIsValidatingSession(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          router.push('/dashboard');
        } else {
          setError(result.error || 'Login failed');
          setIsSubmitting(false);
        }
      } else {
        const result = await register(email, name, password, inviteCode || undefined);
        if (result.success) {
          router.push('/dashboard');
        } else {
          setError(result.error || 'Registration failed');
          setIsSubmitting(false);
        }
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const fillTestCredentials = (userType: 'test' | 'sarah' | 'mike' | 'emma') => {
    const credentials = {
      test: { email: 'test@example.com', password: 'password123' },
      sarah: { email: 'sarah@example.com', password: 'password123' },
      mike: { email: 'mike@example.com', password: 'password123' },
      emma: { email: 'emma@example.com', password: 'password123' },
    };
    setEmail(credentials[userType].email);
    setPassword(credentials[userType].password);
  };

  // Show loading spinner while validating session
  if (isValidatingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-farmhouse">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-farmhouse px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-lg border border-white/55 bg-card/82 shadow-2xl shadow-accent/10 backdrop-blur-xl lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        {/* Brand panel */}
        <section className="relative hidden min-h-full overflow-hidden bg-[#163a3a] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(91,216,207,0.24),transparent_28%),radial-gradient(circle_at_84%_76%,rgba(244,93,60,0.24),transparent_30%)]" />
          <div className="absolute left-12 right-12 top-28 h-px bg-white/14" />
          <div className="absolute bottom-28 left-12 right-12 h-px bg-white/14" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                <Compass className="h-6 w-6" />
              </div>
              <span className="font-display text-3xl font-bold">TripPlanner</span>
            </div>

            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
                <MapPin className="h-4 w-4" />
                Group trips, calmly coordinated
              </div>
              <h1 className="font-display text-6xl font-bold leading-[0.98]">
                One place for the whole crew.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/82">
                Vote on plans, split shared costs, chat with the crew, and keep each trip moving from idea to memory.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, title: 'Invite crew', copy: 'Friends, roles, and RSVPs' },
                { icon: Wallet, title: 'Split costs', copy: 'Bills stay transparent' },
                { icon: MessageCircle, title: 'Stay synced', copy: 'Plans and chat together' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-white/18 bg-white/14 p-4 backdrop-blur">
                    <Icon className="mb-3 h-5 w-5 text-white" />
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-white/70">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Login Form */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Compass className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold">TripPlanner</h1>
          </div>

          {/* Session Expired Banner */}
          {searchParams.get('reason') === 'session_expired' && !bannerDismissed && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/10 p-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Your session expired.</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Please log back in to continue.</p>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="rounded bg-transparent p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {isLogin ? 'TripPlanner' : 'Join the trip'}
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-foreground">
              {isLogin ? 'Welcome' : 'Create an account'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isLogin ? 'Sign in to continue planning your trips' : 'Start planning your next adventure'}
            </p>
            {inviteCode && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">
                  You've been invited! You'll become friends after signing up.
                </span>
              </div>
            )}
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-secondary"
            >
              <GoogleIcon />
              <span className="font-semibold">Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-secondary"
            >
              <FacebookIcon />
              <span className="font-semibold">Continue with Facebook</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-foreground">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Signing up...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="bg-transparent font-semibold text-primary hover:opacity-80"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            <div>
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Test Credentials */}
          {isLogin && (
            <div className="mt-8 rounded-lg border border-border bg-muted/45 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Quick login (test accounts):</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fillTestCredentials('test')}
                  className="rounded border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-secondary"
                >
                  Test User
                </button>
                <button
                  onClick={() => fillTestCredentials('sarah')}
                  className="rounded border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-secondary"
                >
                  Sarah Chen
                </button>
                <button
                  onClick={() => fillTestCredentials('mike')}
                  className="rounded border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-secondary"
                >
                  Mike Johnson
                </button>
                <button
                  onClick={() => fillTestCredentials('emma')}
                  className="rounded border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-secondary"
                >
                  Emma Wilson
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Password: password123</p>
            </div>
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
