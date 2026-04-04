'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await api.forgotPassword(email);
      setSubmitted(true);
      setResetLink(result.resetLink || '');
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[hsl(var(--background))]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[hsl(var(--card))] rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md text-sm font-medium">
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-green-600 text-sm font-medium">Check your email (or see below).</p>
            {resetLink && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Your reset link (email not enabled yet):</p>
                <a href={resetLink} className="text-sm text-blue-600 underline break-all">{resetLink}</a>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground">Back to login</Link>
        </p>
      </div>
    </div>
  );
}