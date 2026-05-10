'use client';

import { signIn } from 'next-auth/react';
import { AppShell } from '@/components/layout/AppShell';
import { OAuthButton } from '@/components/ui/OAuthButton';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  MapPin,
  Plane,
  Sparkles,
} from 'lucide-react';
import React, { useState, useRef } from 'react';

const FEATURE_POINTS = [
  'Vote on plans before anyone books',
  'Keep payments, chats, and dates together',
  'Turn group ideas into confirmed trips',
];

const DESTINATION_CARDS = [
  {
    label: 'Kyoto',
    image: '/images/trip-defaults/locations/japan.png',
    className: 'left-6 top-8 h-32 w-44 rotate-[-5deg] sm:h-36 sm:w-52',
  },
  {
    label: 'Marrakesh',
    image: '/images/trip-defaults/locations/morocco.png',
    className: 'right-5 top-28 h-36 w-48 rotate-[4deg] sm:h-44 sm:w-56',
  },
  {
    label: 'Queenstown',
    image: '/images/trip-defaults/locations/new-zealand.png',
    className: 'bottom-10 left-14 h-40 w-56 rotate-[3deg] sm:h-48 sm:w-64',
  },
];

const TEST_USERS = [
  { label: 'Test User', email: 'test@example.com' },
  { label: 'Sarah Chen', email: 'sarah@example.com' },
  { label: 'Mike Johnson', email: 'mike@example.com' },
  { label: 'Emma Wilson', email: 'emma@example.com' },
];

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
      <div className="relative isolate -m-4 min-h-screen overflow-hidden bg-[#f8efe2] text-[#18312f] sm:-m-6 lg:-m-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(45,188,179,0.34),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(246,91,55,0.22),transparent_30%),linear-gradient(135deg,#fff4e6_0%,#eef7ed_54%,#f7ead8_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#e3f2df]/80 to-transparent" />

        <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.82fr)] lg:px-8">
          <section className="hidden min-h-[42rem] lg:block">
            <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/70 bg-[#163330] shadow-[0_30px_90px_rgba(30,63,57,0.22)]">
              <img
                src="/images/trip-defaults/locations/italy.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#102522]/85 via-[#102522]/34 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102522]/72 via-transparent to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-3 text-white">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2dc4ba] text-[#102522] shadow-lg shadow-black/20">
                      <Compass className="h-6 w-6" />
                    </span>
                    <span className="font-display text-2xl font-bold">TripPlanner</span>
                  </Link>
                  <span className="rounded-full border border-white/25 bg-white/14 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                    Group travel, softer landing
                  </span>
                </div>

                <div className="relative h-[23rem]">
                  {DESTINATION_CARDS.map((destination) => (
                    <div
                      key={destination.label}
                      className={`absolute overflow-hidden rounded-3xl border border-white/50 bg-white/16 shadow-2xl shadow-black/25 backdrop-blur ${destination.className}`}
                    >
                      <img
                        src={destination.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#18312f]">
                        <MapPin className="h-3.5 w-3.5 text-[#f45d3b]" />
                        {destination.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="max-w-xl">
                  <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                    <Sparkles className="h-4 w-4 text-[#ffd166]" />
                    Plan the trip everyone says yes to
                  </p>
                  <h1 className="font-display text-5xl font-bold leading-[0.95] text-white xl:text-6xl">
                    Beautiful plans for messy group travel.
                  </h1>
                  <div className="mt-6 grid gap-3 text-white/88">
                    {FEATURE_POINTS.map((point) => (
                      <p key={point} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="h-5 w-5 text-[#2dc4ba]" />
                        {point}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md py-6 lg:py-0">
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2dc4ba] text-[#102522] shadow-lg shadow-[#2dc4ba]/25">
                  <Compass className="h-5 w-5" />
                </span>
                <span className="font-display text-2xl font-bold text-[#18312f]">TripPlanner</span>
              </Link>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/82 p-1 shadow-[0_28px_80px_rgba(34,55,48,0.18)] backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffaf2]/90 p-5 sm:p-7">
                <div className="mb-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f45d3b] text-white shadow-lg shadow-[#f45d3b]/25">
                      <Plane className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-[#dff6f1] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#16756f]">
                      Private beta
                    </span>
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f45d3b]">Welcome</p>
                  <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-[#18312f]">
                    Sign in and keep the itinerary moving.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#5d716c]">
                    Pick up your group plans, votes, payments, and trip messages in one calm place.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <OAuthButton
                    provider="google"
                    className="h-12 rounded-2xl border-[#e5dac9] bg-white text-[#18312f] shadow-sm hover:bg-[#fff4e6] [&>span]:hidden"
                  />
                  <OAuthButton
                    provider="facebook"
                    className="h-12 rounded-2xl border-[#e5dac9] bg-white text-[#18312f] shadow-sm hover:bg-[#fff4e6] [&>span]:hidden"
                  />
                  <OAuthButton
                    provider="apple"
                    className="h-12 rounded-2xl border-[#e5dac9] bg-white text-[#18312f] shadow-sm hover:bg-[#fff4e6] [&>span]:hidden"
                  />
                </div>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#e5dac9]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ba09a]">
                    email
                  </span>
                  <div className="h-px flex-1 bg-[#e5dac9]" />
                </div>

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
                      className="h-12 rounded-2xl border-[#ded4c5] bg-white px-4 text-[#18312f] placeholder:text-[#9aaaa5] focus-visible:ring-[#2dc4ba]"
                    />
                  </FormField>

                  <FormField label="Password" htmlFor="password" className="mt-4">
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Your password"
                        autoComplete="current-password"
                        className="h-12 rounded-2xl border-[#ded4c5] bg-white px-4 pr-12 text-[#18312f] placeholder:text-[#9aaaa5] focus-visible:ring-[#2dc4ba]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c7f79] transition-colors hover:text-[#18312f]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </FormField>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#5d716c]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#ded4c5] accent-[#f45d3b]"
                      />
                      Remember me
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-bold text-[#f45d3b] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {error && (
                    <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f45d3b] text-base font-bold text-white shadow-xl shadow-[#f45d3b]/25 transition-all hover:-translate-y-0.5 hover:bg-[#df4f31] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                        </svg>
                        Signing in
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 rounded-3xl border border-dashed border-[#d9cfbe] bg-white/62 p-4">
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#7f928c]">
                    Quick login for testing
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEST_USERS.map((user) => (
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
                        className="rounded-2xl border border-[#e5dac9] bg-[#fffaf2] px-3 py-2 text-xs font-bold text-[#51645f] transition-colors hover:border-[#f45d3b] hover:text-[#f45d3b]"
                      >
                        {user.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-5 text-center text-sm text-[#5d716c]">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="font-bold text-[#f45d3b] hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#7c918b]">
              Bali plans, Rome dinners, Vegas weekends, all coordinated here.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
