'use client';

import { signIn } from 'next-auth/react';
import { AppShell } from '@/components/layout/AppShell';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Loader } from 'lucide-react';
import React, { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Registration failed.');
        return;
      }
      // Auto-login after registration using NextAuth so the session cookie
      // is set correctly (middleware checks for next-auth.session-token cookie)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        // Fallback: redirect to login and let user log in manually
        window.location.href = '/login';
      } else {
        // Navigate to dashboard — middleware will allow it (has session cookie)
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell hideTopBar hideBottomBar hideSidebar>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-overlay)] p-6 sm:p-8">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)] mt-6 text-center">Create your account</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1 mb-6 text-center">Join TripPlanner and start planning</p>
          <form onSubmit={handleRegister}>
            <FormField label="Name" htmlFor="name">
              <Input id="name" name="name" type="text" placeholder="Your name" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} />
            </FormField>
            <FormField label="Email" htmlFor="email" className="mt-3">
              <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </FormField>
            <FormField label="Password" htmlFor="password" className="mt-3">
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>
            <button type="submit" disabled={isLoading} className="mt-4 w-full bg-[var(--color-accent)] text-white h-11 rounded-[var(--radius-sm)] text-[var(--text-base)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading ? <><Loader className="animate-spin" size={18} /> Creating account...</> : <>Create Account <ArrowRight size={18} /></>}
            </button>
            {error && <p className="mt-2 text-center text-[var(--text-sm)] text-[var(--color-error)]">{error}</p>}
          </form>
          <p className="mt-5 text-center text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            Already have an account? <Link href="/login" className="text-[var(--color-accent)] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
