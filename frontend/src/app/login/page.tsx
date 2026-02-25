'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Compass, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } else {
      const result = await register(email, name, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Registration failed');
      }
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

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to continue planning your trips' : 'Start planning your next adventure'}
            </p>
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
              disabled={isLoading}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
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
