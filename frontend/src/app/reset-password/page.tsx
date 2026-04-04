'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Token is invalid or expired. Please request a new link.');
    }
  };

  if (!token) return <div className="p-8 text-center">Invalid link. <a href="/forgot-password" className="text-blue-600">Request a new link.</a></div>;
  if (success) return <div className="p-8 text-center text-green-600">Password reset! <a href="/login" className="underline">Login now.</a></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[hsl(var(--background))]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[hsl(var(--card))] rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Set New Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md text-sm font-medium">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}