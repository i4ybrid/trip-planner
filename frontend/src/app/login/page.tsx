'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { Compass, Mail, Lock, User, ArrowRight, UserPlus, Gift, Loader } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-100 to-orange-50 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Compass className="w-16 h-16 text-amber-600" />
            <h1 className="text-5xl font-bold text-amber-800">TripPlanner</h1>
          </div>
          <p className="text-xl text-amber-700 mb-8">
            Plan unforgettable trips with friends. Vote on activities, split costs, and create lasting memories together.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/60 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">🗳️ Group Voting</h3>
              <p className="text-sm text-amber-600">Decide on activities together</p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">💰 Split Payments</h3>
              <p className="text-sm text-amber-600">Easy bill splitting</p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">💬 Group Chat</h3>
              <p className="text-sm text-amber-600">Stay connected with your trip</p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">📸 Share Memories</h3>
              <p className="text-sm text-amber-600">Photos and videos together</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Compass className="w-10 h-10 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-800">TripPlanner</h1>
          </div>

          {/* Session Expired Banner */}
          {searchParams.get('reason') === 'session_expired' && !bannerDismissed && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Your session expired.</p>
                <p className="text-sm text-amber-700 mt-0.5">Please log back in to continue.</p>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-amber-600 hover:text-amber-800 p-1 rounded transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to continue planning your trips' : 'Start planning your next adventure'}
            </p>
            {inviteCode && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
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
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
            >
              <GoogleIcon />
              <span className="font-medium text-gray-700">Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
            >
              <FacebookIcon />
              <span className="font-medium text-gray-700">Continue with Facebook</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="text-amber-600 hover:text-amber-700 font-medium"
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
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick login (test accounts):</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fillTestCredentials('test')}
                  className="px-3 py-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                >
                  Test User
                </button>
                <button
                  onClick={() => fillTestCredentials('sarah')}
                  className="px-3 py-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                >
                  Sarah Chen
                </button>
                <button
                  onClick={() => fillTestCredentials('mike')}
                  className="px-3 py-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                >
                  Mike Johnson
                </button>
                <button
                  onClick={() => fillTestCredentials('emma')}
                  className="px-3 py-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                >
                  Emma Wilson
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Password: password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
